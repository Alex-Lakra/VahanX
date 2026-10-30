import React, { useState } from 'react';
import { useDTCStore } from '../stores/dtcStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useHealthStore } from '../stores/healthStore';
import { openRepairNavigation } from '../utils/mapsNavigation';
import { NetworkSimulatorAdapter } from '../adapters/NetworkSimulatorAdapter';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Trash2,
  Wrench,
  Navigation,
  CheckCircle2,
  Activity,
  Wifi,
} from 'lucide-react';

export const FaultExplorer: React.FC = () => {
  const activeFaults = useDTCStore((s) => s.activeFaults);
  const clearFaults = useDTCStore((s) => s.clearFaults);
  const vehicleType = useConnectionStore((s) => s.vehicleType);
  const adapterInstance = useConnectionStore((s) => s.adapterInstance);

  const healthScore = useHealthStore((s) => s.score);
  const statusBand = useHealthStore((s) => s.statusBand);

  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({
    'P0524': true,
    'SPN 100 FMI 1': true,
  });

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleNavigate = () => {
    openRepairNavigation({ vehicleType });
  };

  const handleClearFaults = () => {
    clearFaults();

    // 1. Send clear commands across NetworkSimulatorAdapter if connected
    if (adapterInstance instanceof NetworkSimulatorAdapter) {
      adapterInstance.sendLimpModeReset();
      adapterInstance.sendClearDTCs();
    } else if (adapterInstance && typeof adapterInstance.send === 'function') {
      adapterInstance.send('04\r');
    }

    // 2. Broadcast clear event to VahanX Simulator via local BroadcastChannel
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('vahanx_telemetry_bus');
        bc.postMessage({ type: 'CLEAR_DTCS', sender: 'DASHBOARD', timestamp: Date.now() });
        bc.postMessage({ type: 'LIMP_MODE_RESET', sender: 'DASHBOARD', timestamp: Date.now() });
        setTimeout(() => bc.close(), 100);
      }
    } catch (e) {
      // Ignore broadcast errors
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-4 max-w-5xl mx-auto space-y-4 font-sans select-none">
      {/* Top Cockpit Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cockpit-card p-4 sm:p-5 rounded-2xl border border-[#1b2536]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
              Diagnostic Trouble Codes & Navigation
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            OBD-II (ISO 15765-4) & SAE J1939 DM1/DM2 SPN/FMI Fault Analysis
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Live Health Impact Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
              statusBand === 'GREEN'
                ? 'bg-emerald-500/20 text-[#00ff9d] border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,157,0.3)]'
                : statusBand === 'AMBER'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                : 'bg-red-500/20 text-rose-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
            }`}
            title="Real-time Health Score impact"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>HEALTH: {healthScore} ({statusBand})</span>
          </div>

          {/* Quick Navigate Button */}
          <button
            onClick={handleNavigate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#00ff9d] text-black font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_12px_rgba(0,255,157,0.4)] transition-all hover:scale-105"
          >
            <Navigation className="w-4 h-4 fill-black" />
            <span>Maps</span>
          </button>

          {/* Clear Codes Button */}
          {activeFaults.length > 0 && (
            <button
              onClick={handleClearFaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141d2a] hover:bg-[#1a2638] text-slate-300 font-mono text-xs border border-[#202e42] transition-colors"
              title="Clear Active DTCs (OBD Mode 04 / J1939 DM11)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Fault Cards List */}
      {activeFaults.length === 0 ? (
        <div className="p-10 sm:p-14 text-center cockpit-card rounded-3xl border border-[#1b2536] space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#0a151f] border border-[#00ff9d]/50 flex items-center justify-center mx-auto text-[#00ff9d] shadow-[0_0_20px_rgba(0,255,157,0.2)]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-white uppercase tracking-wider">
              No Active Diagnostic Trouble Codes
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 font-mono leading-relaxed">
              All engine, transmission, brake, and hydraulic controllers report 0 active DM1 broadcast frames or Mode 03 requests. Vehicle Health Score is optimal.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Monitored live via CAN bus & VahanX Simulator (Deck 3: Fault Code Injector)</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeFaults.map((fault) => {
            const isExpanded = !!expandedCodes[fault.code];
            const isCritical = fault.severity === 'critical';

            return (
              <div
                key={fault.code}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCritical
                    ? 'border-red-600 bg-gradient-to-b from-red-950/40 to-[#0c111a] shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'border-amber-500/80 bg-gradient-to-b from-amber-950/30 to-[#0c111a] shadow-[0_0_16px_rgba(245,158,11,0.2)]'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-600 text-white shadow-[0_0_8px_rgba(239,68,68,0.7)]'
                            : 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                        }`}
                      >
                        {isCritical ? 'CRITICAL FAULT' : 'ADVISORY FAULT'}
                      </span>
                      <span className="font-mono text-sm font-black text-white tracking-wide">
                        {fault.code}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#101724] border border-[#1b2536] text-slate-400">
                        BUS: {fault.source}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight pt-0.5">
                      {fault.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">{fault.description}</p>
                  </div>

                  {/* Google Maps Turn-by-Turn Intent Trigger */}
                  <button
                    onClick={handleNavigate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ff9d] hover:bg-emerald-400 text-black font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_10px_rgba(0,255,157,0.5)] shrink-0 self-start sm:self-center transition-all hover:scale-105"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </button>
                </div>

                {/* Protective Driving Advice Bar */}
                <div className="px-4 py-2.5 bg-[#080d15] border-t border-b border-[#1b2536] text-xs font-mono">
                  <span className="text-amber-400 font-bold uppercase mr-2 tracking-wider">
                    PROTECTIVE DRIVING ADVICE:
                  </span>
                  <span className="text-slate-200">{fault.drivingAdvice}</span>
                </div>

                {/* Root-Cause Drawer Header */}
                <button
                  onClick={() => toggleExpand(fault.code)}
                  className="w-full px-4 py-2.5 bg-[#0a0f18]/60 hover:bg-[#0e1522] flex items-center justify-between text-xs font-mono text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    Diagnostics & Recommended Workshop Steps
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Expandable Root-Cause Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-[#070b12] border-t border-[#1b2536] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                        Potential Root Causes:
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {fault.potentialCauses?.map((cause, i) => (
                          <li key={i}>{cause}</li>
                        )) || <li>Sensor wiring harness disconnect or short circuit</li>}
                      </ul>
                    </div>

                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                        Recommended Workshop Diagnostic Steps:
                      </h5>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {fault.diagnosticSteps?.map((step, i) => (
                          <li key={i}>{step}</li>
                        )) || <li>Inspect CAN bus breakout connector and test probe voltages</li>}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
