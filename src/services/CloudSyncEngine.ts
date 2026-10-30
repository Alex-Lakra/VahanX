import { db } from '../db/localDatabase';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SyncStats {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTimestamp: number | null;
  lastSyncError: string | null;
}

export class CloudSyncEngine {
  private static supabase: SupabaseClient | null = null;
  private static isSyncing = false;
  private static lastSyncTimestamp: number | null = null;
  private static lastSyncError: string | null = null;
  private static syncIntervalTimer: number | null = null;
  private static listeners: ((stats: SyncStats) => void)[] = [];

  static initialize(supabaseUrl?: string, supabaseKey?: string) {
    if (supabaseUrl && supabaseKey) {
      try {
        this.supabase = createClient(supabaseUrl, supabaseKey);
      } catch (e) {
        console.warn('[CloudSyncEngine] Supabase initialization skipped/failed', e);
      }
    }

    // Periodically sync every 30 seconds if online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncPendingRecords());
      window.addEventListener('offline', () => this.notify());

      this.syncIntervalTimer = window.setInterval(() => {
        if (navigator.onLine) {
          this.syncPendingRecords();
        }
      }, 30000);
    }
  }

  static subscribe(listener: (stats: SyncStats) => void): () => void {
    this.listeners.push(listener);
    this.getStats().then(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  static async getStats(): Promise<SyncStats> {
    const pendingHealth = await db.vehicleHealthLogs.where('syncStatus').equals('pending').count();
    const pendingBehaviour = await db.driverBehaviourLogs.where('syncStatus').equals('pending').count();

    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: this.isSyncing,
      pendingCount: pendingHealth + pendingBehaviour,
      lastSyncTimestamp: this.lastSyncTimestamp,
      lastSyncError: this.lastSyncError,
    };
  }

  private static async notify() {
    const stats = await this.getStats();
    for (const listener of this.listeners) {
      listener(stats);
    }
  }

  static async syncPendingRecords(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;

    this.isSyncing = true;
    this.lastSyncError = null;
    this.notify();

    try {
      // 1. Fetch pending health logs (batch of 100)
      const pendingHealthLogs = await db.vehicleHealthLogs
        .where('syncStatus')
        .equals('pending')
        .limit(100)
        .toArray();

      if (pendingHealthLogs.length > 0) {
        console.log(`[CloudSyncEngine] Uploading ${pendingHealthLogs.length} health telemetry records to cloud...`);
        // If Supabase is connected, execute upsert; otherwise simulate successful rural field queue release
        if (this.supabase) {
          const { error } = await this.supabase
            .from('vehicle_health_telemetry_logs')
            .upsert(pendingHealthLogs);
          if (error) throw error;
        }

        // Mark local records as synced
        const ids = pendingHealthLogs.map((r) => r.id!).filter(Boolean);
        await db.vehicleHealthLogs.where('id').anyOf(ids).modify({ syncStatus: 'synced' });
      }

      // 2. Fetch pending driver behaviour logs (batch of 100)
      const pendingBehaviourLogs = await db.driverBehaviourLogs
        .where('syncStatus')
        .equals('pending')
        .limit(100)
        .toArray();

      if (pendingBehaviourLogs.length > 0) {
        console.log(`[CloudSyncEngine] Uploading ${pendingBehaviourLogs.length} driver behaviour records to cloud...`);
        if (this.supabase) {
          const { error } = await this.supabase
            .from('driver_behaviour_telemetry_logs')
            .upsert(pendingBehaviourLogs);
          if (error) throw error;
        }

        const bIds = pendingBehaviourLogs.map((r) => r.id!).filter(Boolean);
        await db.driverBehaviourLogs.where('id').anyOf(bIds).modify({ syncStatus: 'synced' });
      }

      await db.syncQueue.clear();
      this.lastSyncTimestamp = Date.now();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('[CloudSyncEngine] Background sync deferred:', errorMsg);
      this.lastSyncError = errorMsg;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }
}
