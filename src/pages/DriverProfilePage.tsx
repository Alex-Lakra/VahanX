import React, { useState, useEffect, useMemo } from 'react';
import { db, VehicleHealthLog, DriverBehaviourLog, SyncQueueRecord } from '../db/localDatabase';
import { CloudSyncEngine, SyncStats } from '../services/CloudSyncEngine';
import { seedRealisticTelemetryDatabase } from '../db/seedTelemetryData';
import {
  Database,
  Cloud,
  CloudOff,
  RefreshCw,
  TrendingUp,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Activity,
  FileText,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  Layers,
} from 'lucide-react';

export const DriverProfilePage: React.FC = () => {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTimestamp: null,
    lastSyncError: null,
  });

  const [activeTab, setActiveTab] = useState<'health' | 'behaviour' | 'queue'>('health');
  const [recentHealthLogs, setRecentHealthLogs] = useState<VehicleHealthLog[]>([]);
  const [recentBehaviourLogs, setRecentBehaviourLogs] = useState<DriverBehaviourLog[]>([]);
  const [syncQueueLogs, setSyncQueueLogs] = useState<SyncQueueRecord[]>([]);

  const [filterStatus, setFilterStatus] = useState<'all' | 'synced' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowLimit, setRowLimit] = useState<number>(25);
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [isReSeeding, setIsReSeeding] = useState(false);

  useEffect(() => {
    // Check and seed realistic drive cycle data on mount if empty or repetitive
    const initDb = async () => {
      await seedRealisticTelemetryDatabase();
      await refreshLocalLogs();
    };

    initDb();

    // Subscribe to cloud sync engine events
    const unsub = CloudSyncEngine.subscribe((stats) => {
      setSyncStats(stats);
      refreshLocalLogs();
    });

    return () => unsub();
  }, []);

  const refreshLocalLogs = async () => {
    try {
      const hLogs = await db.vehicleHealthLogs.orderBy('id').reverse().limit(50).toArray();
      const bLogs = await db.driverBehaviourLogs.orderBy('id').reverse().limit(50).toArray();
      const qLogs = await db.syncQueue.orderBy('id').reverse().limit(50).toArray();
      setRecentHealthLogs(hLogs);
      setRecentBehaviourLogs(bLogs);
      setSyncQueueLogs(qLogs);
    } catch (e) {
      console.warn('Failed to fetch local database records', e);
    }
  };

  const handleManualSync = () => {
    CloudSyncEngine.syncPendingRecords();
  };

  const handleReSeedDriveCycle = async () => {
    setIsReSeeding(true);
    await seedRealisticTelemetryDatabase(true);
    await refreshLocalLogs();
    setIsReSeeding(false);
  };

  const handleExportCsv = () => {
    if (activeTab === 'health') {
      const headers = [
        'ID',
        'VIN',
        'Operator',
        'RecordedAt',
        'RPM',
        'CoolantTempC',
        'OilTempC',
        'EngineTempC',
        'BoostPressureBar',
        'BatteryVoltageV',
        'BatterySoCPct',
        'ActiveDtcCount',
        'ActiveDtcList',
        'MasterHealthScore',
        'LimpModeActive',
        'SyncStatus',
      ];
      const rows = recentHealthLogs.map((l) => [
        l.id,
        l.vin,
        l.driverId,
        `"${l.recordedAt}"`,
        l.rpm,
        l.coolantTempC,
        l.oilTempC,
        l.engineTempC,
        l.boostPressureBar,
        l.batteryVoltageV,
        l.batterySoCPct,
        l.activeDtcCount,
        `"${(l.activeDtcList || []).join(';')}"`,
        l.masterHealthScore,
        l.isLimpModeActive ? 'ACTIVE' : 'NO',
        l.syncStatus,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `vahanx_vehicle_health_logs_${Date.now()}.csv`, 'text/csv');
    } else if (activeTab === 'behaviour') {
      const headers = [
        'ID',
        'VIN',
        'DriverID',
        'SessionID',
        'RecordedAt',
        'SpeedKmh',
        'SpeedLimitKmh',
        'IsOverspeeding',
        'HarshAccel',
        'HarshBrake',
        'ContinuousDriveMin',
        'SyncStatus',
      ];
      const rows = recentBehaviourLogs.map((l) => [
        l.id,
        l.vin,
        l.driverId,
        l.sessionId,
        `"${l.recordedAt}"`,
        l.speedKmh,
        l.speedLimitKmh,
        l.isOverspeeding ? 'YES' : 'NO',
        l.harshAccelerationEvent ? '1' : '0',
        l.harshBrakingEvent ? '1' : '0',
        l.continuousDrivingMinutes,
        l.syncStatus,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadFile(csv, `vahanx_driver_behaviour_logs_${Date.now()}.csv`, 'text/csv');
    }
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatRelativeTime = (isoString: string): string => {
    const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diffSec < 5) return 'just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    return `${diffHr}h ago`;
  };

  // Filtered Vehicle Health Logs
  const filteredHealthLogs = useMemo(() => {
    return recentHealthLogs
      .filter((log) => {
        if (filterStatus !== 'all' && log.syncStatus !== filterStatus) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          log.rpm.toString().includes(q) ||
          log.coolantTempC.toString().includes(q) ||
          log.oilTempC.toString().includes(q) ||
          log.syncStatus.toLowerCase().includes(q) ||
          (log.activeDtcList && log.activeDtcList.some((d) => d.toLowerCase().includes(q))) ||
          new Date(log.recordedAt).toLocaleTimeString().toLowerCase().includes(q)
        );
      })
      .slice(0, rowLimit);
  }, [recentHealthLogs, filterStatus, searchQuery, rowLimit]);

  // Filtered Driver Behaviour Logs
  const filteredBehaviourLogs = useMemo(() => {
    return recentBehaviourLogs
      .filter((log) => {
        if (filterStatus !== 'all' && log.syncStatus !== filterStatus) return false;
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          log.speedKmh.toString().includes(q) ||
          log.syncStatus.toLowerCase().includes(q) ||
          new Date(log.recordedAt).toLocaleTimeString().toLowerCase().includes(q)
        );
      })
      .slice(0, rowLimit);
  }, [recentBehaviourLogs, filterStatus, searchQuery, rowLimit]);

  return (
      <div className="min-h-[calc(100vh-80px)] p-3 sm:p-5 max-w-7xl mx-auto space-y-5 font-sans select-none">
        {/* Page Title & Main Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cockpit-card p-4 sm:p-5 rounded-2xl border border-[#1b2536]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]" />
              <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
                Driver Profile & Telemetry Database Sheet
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Offline-First Local Storage (IndexedDB Dexie Engine) & Supabase REST Background Sync
            </p>
          </div>

            {/* Global Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleReSeedDriveCycle}
                disabled={isReSeeding}
                title="Populate dynamic realistic 45-min field drive cycle"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#0c1421] text-cyan-300 border border-cyan-800/40 hover:bg-[#132238] transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReSeeding ? 'animate-spin' : ''}`} />
                <span>RE-SEED DRIVE CYCLE</span>
              </button>

              <button
                onClick={handleExportCsv}
                title="Export telemetry database sheet as CSV"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#0c1421] text-slate-200 border border-[#1b2536] hover:bg-[#152033] transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#00ff9d]" />
                <span>EXPORT CSV</span>
              </button>

              <button
                onClick={handleManualSync}
                disabled={syncStats.isSyncing}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(0,255,157,0.3)] ${syncStats.isSyncing
                    ? 'bg-amber-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-emerald-600 to-[#00ff9d] text-black hover:scale-105'
                  }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStats.isSyncing ? 'animate-spin' : ''}`} />
                <span>{syncStats.isSyncing ? 'SYNCING QUEUE...' : 'SYNC CLOUD NOW'}</span>
              </button>
            </div>
          </div>

          {/* DRIVER STATS CARD */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl cockpit-card border border-[#1b2536]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Operator Name</span>
              <span className="text-lg font-mono font-bold text-white block mt-1">Harvinder Singh</span>
              <span className="text-[10px] font-mono text-[#00ff9d]">Agricultural Fleet Operator</span>
            </div>

            <div className="p-4 rounded-2xl cockpit-card border border-[#1b2536]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Assigned VIN</span>
              <span className="text-lg font-mono font-bold text-cyan-300 block mt-1">JD-8R-410-2026</span>
              <span className="text-[10px] font-mono text-slate-400">Class: HDV / Heavy Tractor</span>
            </div>

            <div className="p-4 rounded-2xl cockpit-card border border-[#1b2536]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Safety Score</span>
              <span className="text-3xl font-display font-black text-[#00ff9d] block mt-1">98.4 / 100</span>
              <span className="text-[10px] font-mono text-slate-400">Top 5% Fleet Compliance</span>
            </div>

            <div className="p-4 rounded-2xl cockpit-card border border-[#1b2536]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Continuous Operation</span>
              <span className="text-3xl font-display font-black text-white block mt-1">4.2 hrs</span>
              <span className="text-[10px] font-mono text-amber-400">Rest break recommended at 5.0 hrs</span>
            </div>
          </div>

          {/* DRIVER BEHAVIOUR TELEMETRY ANALYTICS */}
          <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#172130] pb-2.5">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                Driver Behaviour Telemetry (Field Aggregates)
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="p-3.5 bg-[#090e17] rounded-2xl border border-[#162130]">
                <span className="text-slate-400 block text-[10px] uppercase">HARSH BRAKING</span>
                <span className="text-2xl font-display font-black text-white mt-1 block">0 events</span>
                <span className="text-[10px] text-slate-500">Decel &gt; 0.4g threshold</span>
              </div>

              <div className="p-3.5 bg-[#090e17] rounded-2xl border border-[#162130]">
                <span className="text-slate-400 block text-[10px] uppercase">RAPID THROTTLE STABS</span>
                <span className="text-2xl font-display font-black text-white mt-1 block">1 event</span>
                <span className="text-[10px] text-slate-500">&gt;80% TPS delta/s (High Draft)</span>
              </div>

              <div className="p-3.5 bg-[#090e17] rounded-2xl border border-[#162130]">
                <span className="text-slate-400 block text-[10px] uppercase">CORNERING G-FORCE</span>
                <span className="text-2xl font-display font-black text-[#00ff9d] mt-1 block">0.18 g (Stable)</span>
                <span className="text-[10px] text-slate-500">Anti-rollover envelope</span>
              </div>

              <div className="p-3.5 bg-[#090e17] rounded-2xl border border-[#162130]">
                <span className="text-slate-400 block text-[10px] uppercase">SPEEDING DURATION</span>
                <span className="text-2xl font-display font-black text-white mt-1 block">0 min</span>
                <span className="text-[10px] text-slate-500">100% field speed compliance</span>
              </div>
            </div>
          </div>

          {/* OFFLINE QUEUE & CLOUD SYNC STATUS */}
          <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#172130] pb-2.5">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
                    Rural Field Offline Telemetry Database (IndexedDB Storage)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  {syncStats.isOnline ? (
                    <span className="flex items-center gap-1.5 text-[#00ff9d] font-bold">
                      <Cloud className="w-4 h-4" />
                      ONLINE (CAN-GATEWAY / 4G ACTIVE)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <CloudOff className="w-4 h-4" />
                      OFFLINE (BUFFERING TO LOCAL INDEXEDDB)
                    </span>
                  )}
                </div>
              </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#090e17] border border-[#182333] text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Pending Cloud Sync Records</span>
                    <span className="text-2xl font-display font-black text-amber-400">
                      {syncStats.pendingCount} records queued
                    </span>
                  </div>

                  <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Last Cloud Sync Timestamp</span>
                      <span className="text-slate-200 font-bold text-sm block mt-1">
                        {syncStats.lastSyncTimestamp
                          ? new Date(syncStats.lastSyncTimestamp).toLocaleTimeString()
                : 'Initial session in queue'}
                      </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Sync Protocol & Table</span>
                    <span className="text-[#00ff9d] font-bold text-sm block mt-1">
                      Dexie.js v4 &bull; Supabase REST
                    </span>
                  </div>
                </div>

                          {/* Database Sheet Controls & Tab Switcher */ }
                          < div className="space-y-3 pt-2">
                        {/* Tab selector */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#172130] pb-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveTab('health')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'health'
                                  ? 'bg-[#1b2a40] text-[#00ff9d] border border-emerald-500/40 shadow-[0_0_10px_rgba(0,255,157,0.2)]'
                                  : 'text-slate-400 hover:text-white bg-[#0a0f17] border border-[#172130]'
                                }`}
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Vehicle Health ({recentHealthLogs.length})</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('behaviour')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'behaviour'
                                  ? 'bg-[#1b2a40] text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                                  : 'text-slate-400 hover:text-white bg-[#0a0f17] border border-[#172130]'
                                }`}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              <span>Driver Behaviour ({recentBehaviourLogs.length})</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('queue')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'queue'
                                  ? 'bg-[#1b2a40] text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                  : 'text-slate-400 hover:text-white bg-[#0a0f17] border border-[#172130]'
                                }`}
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Sync Queue Payload ({syncQueueLogs.length})</span>
                            </button>
                          </div>

                          {/* Filter and Limit controls */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Status pill filter */}
                            <div className="flex items-center bg-[#070c14] rounded-xl p-1 border border-[#182333] text-[11px] font-mono">
                              <button
                                onClick={() => setFilterStatus('all')}
                                className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${filterStatus === 'all' ? 'bg-[#1e2a3c] text-white' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                              >
                                All
                              </button>
                              <button
                                onClick={() => setFilterStatus('synced')}
                                className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${filterStatus === 'synced' ? 'bg-emerald-500/20 text-[#00ff9d]' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                              >
                                Synced
                              </button>
                              <button
                                onClick={() => setFilterStatus('pending')}
                                className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all ${filterStatus === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-slate-200'
                                  }`}
                              >
                                Pending ({syncStats.pendingCount})
                              </button>
                            </div>

                            {/* Rows limit */}
                            <div className="flex items-center gap-1 bg-[#070c14] px-2 py-1 rounded-xl border border-[#182333] text-[11px] font-mono text-slate-400">
                              <span>Show:</span>
                              <select
                                value={rowLimit}
                                onChange={(e) => setRowLimit(Number(e.target.value))}
                                className="bg-transparent text-white font-bold outline-none cursor-pointer"
                              >
                                <option value={10} className="bg-[#070c14] text-white">10</option>
                                <option value={25} className="bg-[#070c14] text-white">25</option>
                                <option value={50} className="bg-[#070c14] text-white">50</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Search bar */}
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search database rows by RPM, temp, DTC code, or sync status..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#080d16] border border-[#1a2538] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                          />
                        </div>

                        {/* TAB 1: VEHICLE HEALTH TELEMETRY TABLE */}
                        {activeTab === 'health' && (
            <div className="overflow-x-auto border border-[#1b2536] rounded-2xl bg-[#060a11]">
              <table className="w-full text-left text-xs font-mono divide-y divide-[#152030]">
                <thead className="bg-[#0a0f18] text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Rec #</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">RPM</th>
                    <th className="py-3 px-3">Coolant</th>
                    <th className="py-3 px-3">Oil Temp</th>
                    <th className="py-3 px-3">Boost</th>
                    <th className="py-3 px-3">Battery</th>
                    <th className="py-3 px-3">DTC Diagnostics</th>
                    <th className="py-3 px-3">Health Score</th>
                    <th className="py-3 px-3">Limp Mode</th>
                    <th className="py-3 px-3">Sync Status</th>
                    <th className="py-3 px-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141e2d] bg-[#070b13]">
                  {filteredHealthLogs.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="p-8 text-center text-slate-500">
                        No telemetry logs match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredHealthLogs.map((log) => {
                      const isExpanded = expandedRowId === log.id;
                      const hasDtc = log.activeDtcCount > 0;

                      // Color code RPM
                      const rpmColor =
                        log.rpm >= 2200
                          ? 'text-amber-400 font-bold'
                          : log.rpm <= 850
                          ? 'text-cyan-300 font-bold'
                          : 'text-[#00ff9d] font-bold';

                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandedRowId(isExpanded ? null : (log.id ?? null))}
                            className={`cursor-pointer transition-colors ${
                              isExpanded ? 'bg-[#101927]' : 'hover:bg-[#0c131f]'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                              #{log.id}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="text-white font-bold block">
                                {new Date(log.recordedAt).toLocaleTimeString()}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {formatRelativeTime(log.recordedAt)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={rpmColor}>{log.rpm.toLocaleString()}</span>
                              <span className="text-[10px] text-slate-500 ml-1">RPM</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold ${
                                  log.coolantTempC >= 94 ? 'text-amber-400' : 'text-slate-200'
                                }`}
                              >
                                {log.coolantTempC} °C
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold ${
                                  log.oilTempC >= 97 ? 'text-amber-400' : 'text-slate-200'
                                }`}
                              >
                                {log.oilTempC} °C
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-cyan-300 font-bold">
                              {log.boostPressureBar.toFixed(2)} bar
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {log.batteryVoltageV.toFixed(1)}V &bull; {log.batterySoCPct}%
                            </td>
                            <td className="py-2.5 px-3">
                              {hasDtc ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                  <AlertTriangle className="w-3 h-3" />
                                  {(log.activeDtcList || []).join(', ') || `${log.activeDtcCount} DTC`}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3 text-[#00ff9d]" />
                                  0 FAULTS
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`font-bold ${
                                  log.masterHealthScore >= 95
                                    ? 'text-[#00ff9d]'
                                    : log.masterHealthScore >= 90
                                    ? 'text-cyan-300'
                                    : 'text-amber-400'
                                }`}
                              >
                                {log.masterHealthScore} / 100
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {log.isLimpModeActive ? (
                                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/40">
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="text-slate-400">STANDBY</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                                  log.syncStatus === 'synced'
                                    ? 'bg-emerald-500/20 text-[#00ff9d] border border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                                }`}
                              >
                                {log.syncStatus === 'synced' ? (
                                  <Cloud className="w-3 h-3 text-[#00ff9d]" />
                                ) : (
                                  <Clock className="w-3 h-3 text-amber-400" />
                                )}
                                {log.syncStatus === 'synced' ? 'SYNCED' : 'PENDING'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRowId(isExpanded ? null : (log.id ?? null));
                                }}
                                className="p-1 rounded hover:bg-[#192538] text-slate-400 hover:text-white transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Telemetry Inspector Row */}
                          {isExpanded && (
                            <tr className="bg-[#0b121e]">
                              <td colSpan={12} className="p-4 border-t border-[#172335]">
                                <div className="space-y-3 font-mono text-xs">
                                  <div className="flex items-center justify-between border-b border-[#18263a] pb-2">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-[#00ff9d]" />
                                      <span className="font-bold text-white uppercase tracking-wider">
                                        Frame #{log.id} Full Diagnostic Telemetry Payload
                                      </span>
                                    </div>
                                    <span className="text-slate-400 text-[11px]">
                                      Exact ISO: {log.recordedAt}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-[#060a12] p-2.5 rounded-xl border border-[#141f30]">
                                      <span className="text-slate-400 block text-[10px] uppercase">
                                        Vehicle VIN
                                      </span>
                                      <span className="text-cyan-300 font-bold block mt-0.5">
                                        {log.vin}
                                      </span>
                                    </div>

                                    <div className="bg-[#060a12] p-2.5 rounded-xl border border-[#141f30]">
                                      <span className="text-slate-400 block text-[10px] uppercase">
                                        Operator ID
                                      </span>
                                      <span className="text-white font-bold block mt-0.5">
                                        {log.driverId}
                                      </span>
                                    </div>

                                    <div className="bg-[#060a12] p-2.5 rounded-xl border border-[#141f30]">
                                      <span className="text-slate-400 block text-[10px] uppercase">
                                        Hydraulics Score
                                      </span>
                                      <span className="text-[#00ff9d] font-bold block mt-0.5">
                                        {log.hydraulicsHealthScore ?? 95}%
                                      </span>
                                    </div>

                                    <div className="bg-[#060a12] p-2.5 rounded-xl border border-[#141f30]">
                                      <span className="text-slate-400 block text-[10px] uppercase">
                                        Engine Temp (Raw)
                                      </span>
                                      <span className="text-slate-200 font-bold block mt-0.5">
                                        {log.engineTempC} °C
                                      </span>
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-slate-400 text-[10px] uppercase tracking-wider block mb-1">
                                      Raw JSON Frame Object (Dexie vehicleHealthLogs):
                                    </span>
                                    <pre className="p-3 rounded-xl bg-[#05080f] border border-[#141f30] text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                                      {JSON.stringify(log, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: DRIVER BEHAVIOUR TABLE */}
          {activeTab === 'behaviour' && (
            <div className="overflow-x-auto border border-[#1b2536] rounded-2xl bg-[#060a11]">
              <table className="w-full text-left text-xs font-mono divide-y divide-[#152030]">
                <thead className="bg-[#0a0f18] text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Rec #</th>
                    <th className="py-3 px-3">Timestamp</th>
                    <th className="py-3 px-3">Operator</th>
                    <th className="py-3 px-3">Vehicle Speed</th>
                    <th className="py-3 px-3">Speed Limit</th>
                    <th className="py-3 px-3">Speed Status</th>
                    <th className="py-3 px-3">Harsh Accel</th>
                    <th className="py-3 px-3">Harsh Brake</th>
                    <th className="py-3 px-3">Continuous Drive</th>
                    <th className="py-3 px-3">Reaction Time</th>
                    <th className="py-3 px-3">Sync Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141e2d] bg-[#070b13]">
                  {filteredBehaviourLogs.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-slate-500">
                        No driver behaviour records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBehaviourLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#0c131f] transition-colors">
                        <td className="py-2.5 px-3 text-slate-400">#{log.id}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-white font-bold block">
                            {new Date(log.recordedAt).toLocaleTimeString()}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {formatRelativeTime(log.recordedAt)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 font-bold">{log.driverId}</td>
                        <td className="py-2.5 px-3 text-white font-bold">{log.speedKmh} km/h</td>
                        <td className="py-2.5 px-3 text-slate-400">{log.speedLimitKmh} km/h</td>
                        <td className="py-2.5 px-3">
                          {log.isOverspeeding ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold border border-amber-500/40">
                              OVERSPEED (+{log.speedKmh - log.speedLimitKmh} km/h)
                            </span>
                          ) : (
                            <span className="text-[#00ff9d] font-bold">COMPLIANT</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.harshAccelerationEvent ? (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
                              1 EVENT
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {log.harshBrakingEvent ? (
                            <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                              1 EVENT
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200">
                          {log.continuousDrivingMinutes} min
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300">
                          {log.reactionTimeToWarningsSeconds ?? 0.8}s
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              log.syncStatus === 'synced'
                                ? 'bg-emerald-500/20 text-[#00ff9d] border border-emerald-500/40'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
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
          )}

          {/* TAB 3: CLOUD SYNC QUEUE PAYLOAD */}
          {activeTab === 'queue' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#0a0f18] rounded-xl border border-[#1b2536] text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>
                  Offline Queue Buffer Table: <strong className="text-white">syncQueue</strong>
                </span>
                <span className="text-amber-400 font-bold">
                  {syncQueueLogs.length} Records Pending Cloud REST Push
                </span>
              </div>

              {syncQueueLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 cockpit-card rounded-2xl border border-[#1b2536] font-mono text-xs">
                  All local queue entries have been synchronized with cloud storage. Queue buffer empty.
                </div>
              ) : (
                <div className="space-y-2">
                  {syncQueueLogs.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-[#060a12] border border-[#162234] font-mono text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 font-bold uppercase">
                          Queue Item #{q.id} &bull; Target Table: {q.tableName}
                        </span>
                        <span className="text-slate-500">
                          Enqueued: {new Date(q.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-[#04060c] text-[11px] text-slate-300 overflow-x-auto border border-[#121c2c]">
                        {JSON.stringify(q.payload, null, 2)}
                      </pre>
                    </div>
                  ))}
                  </div>
              )}
                </div>
          )}
              </div>
            </div>
          </div>
          );
};
