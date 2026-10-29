import React, { useState, useEffect } from 'react';
import { db, VehicleHealthLog, DriverBehaviourLog } from '../db/localDatabase';
import { CloudSyncEngine, SyncStats } from '../services/CloudSyncEngine';
import {
  UserCheck,
  Database,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const DriverProfilePage: React.FC = () => {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTimestamp: null,
    lastSyncError: null,
  });

  const [recentHealthLogs, setRecentHealthLogs] = useState<VehicleHealthLog[]>([]);
  const [recentBehaviourLogs, setRecentBehaviourLogs] = useState<DriverBehaviourLog[]>([]);

  useEffect(() => {
    // Subscribe to cloud sync engine events
    const unsub = CloudSyncEngine.subscribe((stats) => {
      setSyncStats(stats);
      refreshLocalLogs();
    });

    refreshLocalLogs();
    return () => unsub();
  }, []);

  const refreshLocalLogs = async () => {
    try {
      const hLogs = await db.vehicleHealthLogs.orderBy('id').reverse().limit(10).toArray();
      const bLogs = await db.driverBehaviourLogs.orderBy('id').reverse().limit(10).toArray();
      setRecentHealthLogs(hLogs);
      setRecentBehaviourLogs(bLogs);
    } catch (e) {
      console.warn('Failed to fetch local database records', e);
    }
  };

  const handleManualSync = () => {
    CloudSyncEngine.syncPendingRecords();
  };

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 8: Driver Profile & Cloud Sync Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Offline-First Local Storage (IndexedDB/SQLite) & Background Supabase Telemetry Synchronization
          </p>
        </div>

        {/* Sync Status Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={syncStats.isSyncing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all shadow ${
              syncStats.isSyncing
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStats.isSyncing ? 'animate-spin' : ''}`} />
            <span>{syncStats.isSyncing ? 'SYNCING QUEUE...' : 'SYNC CLOUD NOW'}</span>
          </button>
        </div>
      </div>

      {/* DRIVER STATS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0b0e18] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase block">Operator Name</span>
          <span className="text-lg font-mono font-bold text-white block mt-1">Harvinder Singh</span>
          <span className="text-[10px] font-mono text-emerald-400">Agricultural Fleet Operator</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0e18] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase block">Assigned VIN</span>
          <span className="text-lg font-mono font-bold text-cyan-300 block mt-1">JD-8R-410-2026</span>
          <span className="text-[10px] font-mono text-slate-400">Class: HDV / Tractor</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0e18] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase block">Cumulative Safety Score</span>
          <span className="text-2xl font-mono font-extrabold text-emerald-400 block mt-1">98.4 / 100</span>
          <span className="text-[10px] font-mono text-slate-400">Top 5% Fleet Compliance</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0b0e18] border border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase block">Continuous Operating Time</span>
          <span className="text-2xl font-mono font-extrabold text-white block mt-1">4.2 hrs</span>
          <span className="text-[10px] font-mono text-amber-400">Rest break recommended at 5.0 hrs</span>
        </div>
      </div>

      {/* DRIVER BEHAVIOUR TELEMETRY ANALYTICS */}
      <div className="p-5 rounded-2xl bg-[#0b0e18] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Driver Behaviour Telemetry (Field Aggregates)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">HARSH BRAKING</span>
            <span className="text-2xl font-bold text-white mt-1 block">0 events</span>
            <span className="text-[10px] text-slate-500">Decel &gt; 0.4g threshold</span>
          </div>

          <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">RAPID THROTTLE STABS</span>
            <span className="text-2xl font-bold text-white mt-1 block">1 event</span>
            <span className="text-[10px] text-slate-500">&gt;80% TPS delta/s</span>
          </div>

          <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">CORNERING G-FORCE</span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">0.18 g (Stable)</span>
            <span className="text-[10px] text-slate-500">Anti-rollover envelope</span>
          </div>

          <div className="p-3 bg-black/60 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">SPEEDING DURATION</span>
            <span className="text-2xl font-bold text-white mt-1 block">0 min</span>
            <span className="text-[10px] text-slate-500">100% field speed compliance</span>
          </div>
        </div>
      </div>

      {/* OFFLINE QUEUE & CLOUD SYNC STATUS */}
      <div className="p-5 rounded-2xl bg-[#0b0e18] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Rural Field Offline Queue (IndexedDB Storage)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            {syncStats.isOnline ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Cloud className="w-4 h-4" />
                ONLINE (Wi-Fi / 4G)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-400">
                <CloudOff className="w-4 h-4" />
                OFFLINE (QUEUING LOCALLY)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-black/60 border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-400 block">Pending Cloud Sync Records:</span>
            <span className="text-2xl font-black text-white">{syncStats.pendingCount} records</span>
          </div>

          <div>
            <span className="text-slate-400 block">Last Cloud Sync Timestamp:</span>
            <span className="text-slate-200">
              {syncStats.lastSyncTimestamp
                ? new Date(syncStats.lastSyncTimestamp).toLocaleTimeString()
                : 'Pending initial sync'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block">Sync Protocol:</span>
            <span className="text-emerald-400 font-bold">PostgreSQL / Supabase REST</span>
          </div>
        </div>

        {/* Recent Queued Telemetry Logs Table */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
            Recent Local IndexedDB Telemetry Entries (Sampled Every 5s):
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-900 text-slate-400">
                <tr>
                  <th className="p-2 border-b border-slate-800">Time</th>
                  <th className="p-2 border-b border-slate-800">RPM</th>
                  <th className="p-2 border-b border-slate-800">Coolant</th>
                  <th className="p-2 border-b border-slate-800">Oil Temp</th>
                  <th className="p-2 border-b border-slate-800">Health Score</th>
                  <th className="p-2 border-b border-slate-800">Limp Mode</th>
                  <th className="p-2 border-b border-slate-800">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-black/40">
                {recentHealthLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-500">
                      No local logs recorded yet. Telemetry writes start on connection.
                    </td>
                  </tr>
                ) : (
                  recentHealthLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-2 text-slate-300">
                        {new Date(log.recordedAt).toLocaleTimeString()}
                      </td>
                      <td className="p-2 text-white">{log.rpm}</td>
                      <td className="p-2 text-slate-300">{log.coolantTempC} °C</td>
                      <td className="p-2 text-slate-300">{log.oilTempC} °C</td>
                      <td className="p-2 text-emerald-400 font-bold">{log.masterHealthScore}</td>
                      <td className="p-2 text-slate-300">
                        {log.isLimpModeActive ? (
                          <span className="text-red-400 font-bold">ACTIVE</span>
                        ) : (
                          'No'
                        )}
                      </td>
                      <td className="p-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            log.syncStatus === 'synced'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {log.syncStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

