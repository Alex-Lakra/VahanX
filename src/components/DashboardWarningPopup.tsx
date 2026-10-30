import React from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export const DashboardWarningPopup: React.FC = () => {
  const activeAlert = useTelemetryStore((s) => s.activeAlert);
  const dismissAlert = useTelemetryStore((s) => s.dismissAlert);

  if (!activeAlert) return null;

  const isCritical = activeAlert.level === 'critical';

  return (
    <div
      className={`fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 p-5 rounded-2xl border transition-all duration-200 select-none ${
        isCritical
          ? 'bg-gradient-to-b from-red-950/95 to-[#0f0909] border-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)]'
          : 'bg-gradient-to-b from-amber-950/95 to-[#120e09] border-amber-500 text-amber-100 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          )}
          <span className="font-mono text-sm font-black uppercase tracking-wider">
            {isCritical ? 'CRITICAL SYSTEM WARNING' : 'ADVISORY WARNING'}
          </span>
        </div>
        <button
          onClick={dismissAlert}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          title="Acknowledge alert"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-2.5">
        <h4 className="font-display font-extrabold text-lg tracking-tight text-white">{activeAlert.title}</h4>
        <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed font-mono">
          {activeAlert.message}
        </p>
      </div>

      {/* Immediate Driving Style Adjustments */}
      <div className="mt-3.5 p-3 rounded-xl bg-[#07090e] border border-[#1b2536]">
        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1.5 mb-1">
          <span>REQUIRED DRIVING-STYLE ADJUSTMENT</span>
        </div>
        <p className="text-xs font-mono text-slate-200 leading-snug">
          {activeAlert.drivingAdvice}
        </p>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={dismissAlert}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all shadow ${
            isCritical
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40'
              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/40'
          }`}
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};
