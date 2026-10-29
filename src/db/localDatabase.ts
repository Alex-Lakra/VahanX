import Dexie, { Table } from 'dexie';

export interface VehicleHealthLog {
  id?: number;
  vin: string;
  driverId: string;
  recordedAt: string; // ISO string
  engineTempC: number;
  oilTempC: number;
  coolantTempC: number;
  rpm: number;
  boostPressureBar: number;
  batteryVoltageV: number;
  batterySoCPct: number;
  activeDtcCount: number;
  activeDtcList: string[];
  masterHealthScore: number;
  hydraulicsHealthScore?: number | null;
  isLimpModeActive: boolean;
  limpModeOverridden: boolean;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface DriverBehaviourLog {
  id?: number;
  driverId: string;
  vin: string;
  sessionId: string;
  recordedAt: string;
  speedKmh: number;
  speedLimitKmh: number;
  isOverspeeding: boolean;
  harshAccelerationEvent: boolean;
  harshBrakingEvent: boolean;
  harshCorneringEvent: boolean;
  continuousDrivingMinutes: number;
  reactionTimeToWarningsSeconds?: number;
  tuningPageAccessed?: boolean;
  tuningChangesApplied?: Record<string, unknown> | null;
  limpModeOverrideEvent?: boolean;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SyncQueueRecord {
  id?: number;
  tableName: 'vehicle_health_telemetry_logs' | 'driver_behaviour_telemetry_logs';
  localRecordId: number;
  payload: Record<string, unknown>;
  createdAt: string;
  retryCount: number;
}

export class VahanXDatabase extends Dexie {
  vehicleHealthLogs!: Table<VehicleHealthLog, number>;
  driverBehaviourLogs!: Table<DriverBehaviourLog, number>;
  syncQueue!: Table<SyncQueueRecord, number>;

  constructor() {
    super('VahanXDatabase');
    this.version(1).stores({
      vehicleHealthLogs: '++id, vin, driverId, recordedAt, syncStatus, masterHealthScore',
      driverBehaviourLogs: '++id, driverId, vin, sessionId, recordedAt, syncStatus',
      syncQueue: '++id, tableName, localRecordId, createdAt, retryCount',
    });
  }
}

export const db = new VahanXDatabase();

