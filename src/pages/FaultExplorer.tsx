import React, { useState } from 'react';
import { useDTCStore } from '../stores/dtcStore';
import { useConnectionStore } from '../stores/connectionStore';
import { openRepairNavigation } from '../utils/mapsNavigation';
import { lookupDTC } from '../data/dtcDictionary';
import {
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  MapPin,
  Trash2,
  PlusCircle,
  HelpCircle,
  Wrench,
  Navigation,
} from 'lucide-react';

export const FaultExplorer: React.FC = () => {
  const activeFaults = useDTCStore((s) => s.activeFaults);
  const clearFaults = useDTCStore((s) => s.clearFaults);
  const addFaults = useDTCStore((s) => s.addFaults);
  const vehicleType = useConnectionStore((s) => s.vehicleType);

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

  const handleInjectSample = (code: string) => {
    const entry = lookupDTC(code);
    addFaults([
      {
        code: entry.code,
        source: entry.source,
        spn: entry.spn,
        fmi: entry.fmi,
        title: entry.title,
        description: entry.description,
        severity: entry.severity,
        drivingAdvice: entry.drivingAdvice,
        potentialCauses: entry.potentialCauses,
        diagnosticSteps: entry.diagnosticSteps,
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-5xl mx-auto space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 2: Diagnostic Trouble Codes & Repair Locator
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            OBD-II (ISO 15765-4) & SAE J1939 DM1/DM2 SPN/FMI Fault Translation Engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Navigate Button */}
          <button
            onClick={handleNavigate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg glow-neon transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Maps Navigation</span>
          </button>

          {/* Clear Codes Button */}
          {activeFaults.length > 0 && (
            <button
              onClick={clearFaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
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
        <div className="p-12 text-center bg-[#090d16] rounded-2xl border border-dashed border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
            ✓
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-white uppercase">
              No Active Diagnostic Trouble Codes Detected
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              All engine, transmission, braking, and hydraulic controllers report zero active DM1 or Mode 03 faults.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-mono text-slate-500 mr-2">Simulate Fault:</span>
            <button
              onClick={() => handleInjectSample('P0524')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-red-300 border border-red-900/60"
            >
              + P0524 (Low Oil Press)
            </button>
            <button
              onClick={() => handleInjectSample('SPN 100 FMI 1')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-red-300 border border-red-900/60"
            >
              + SPN 100 FMI 1 (J1939 Oil)
            </button>
            <button
              onClick={() => handleInjectSample('SPN 1087 FMI 1')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-amber-300 border border-amber-900/60"
            >
              + SPN 1087 FMI 1 (Air Brake)
            </button>
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
                className={`rounded-2xl border-2 transition-all overflow-hidden ${
                  isCritical
                    ? 'border-red-600 bg-red-950/30 glow-danger'
                    : 'border-amber-500/80 bg-amber-950/20 glow-amber'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-mono font-black uppercase tracking-wider ${
                          isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                        }`}
                      >
                        {isCritical ? 'CRITICAL FAULT' : 'ADVISORY FAULT'}
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-200">
                        {fault.code}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        SOURCE: {fault.source}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white tracking-tight pt-1">
                      {fault.title}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{fault.description}</p>
                  </div>

                  {/* Google Maps Turn-by-Turn Intent Trigger */}
                  <button
                    onClick={handleNavigate}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold tracking-wider uppercase shadow shrink-0 self-start sm:self-center"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Navigate</span>
                  </button>
                </div>

                {/* Protective Driving Advice Bar */}
                <div className="px-4 py-2.5 bg-black/60 border-t border-b border-slate-800 text-xs font-mono">
                  <span className="text-amber-400 font-bold uppercase mr-2">
                    PROTECTIVE DRIVING ADVICE:
                  </span>
                  <span className="text-slate-100">{fault.drivingAdvice}</span>
                </div>

                {/* Root-Cause Drawer Header */}
                <button
                  onClick={() => toggleExpand(fault.code)}
                  className="w-full px-4 py-2.5 bg-slate-900/40 hover:bg-slate-900/80 flex items-center justify-between text-xs font-mono text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    Expand Root-Cause Diagnostics & Troubleshooting Steps
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* Expandable Root-Cause Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-black/50 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="space-y-1.5">
                      <h5 className="text-[11px] font-bold uppercase tracking-wider text-red-400">
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

