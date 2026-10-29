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
      className={`fixed top-16 left-4 right-4 sm:left-auto sm:right-6 sm:w-[480px] z-50 p-4 rounded-xl border-2 shadow-2xl transition-all duration-200 ${
        isCritical
          ? 'bg-red-950 border-red-500 text-white shadow-red-950/80 glow-danger'
          : 'bg-amber-950 border-amber-500 text-amber-100 shadow-amber-950/80 glow-amber'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          )}
          <span className="font-mono text-sm font-extrabold uppercase tracking-wide">
            {isCritical ? 'CRITICAL SYSTEM WARNING' : 'ADVISORY WARNING'}
          </span>
        </div>
        <button
          onClick={dismissAlert}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          title="Acknowledge alert"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-2">
        <h4 className="font-bold text-base tracking-tight">{activeAlert.title}</h4>
        <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
          {activeAlert.message}
        </p>
      </div>

      {/* Immediate Driving Style Adjustments */}
      <div className="mt-3 p-2.5 rounded-lg bg-black/60 border border-slate-700/80">
        <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-1">
          <span>REQUIRED DRIVING-STYLE ADJUSTMENT</span>
        </div>
        <p className="text-xs font-mono text-slate-100 leading-snug">
          {activeAlert.drivingAdvice}
        </p>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={dismissAlert}
          className={`px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase transition-colors ${
            isCritical
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-black'
          }`}
        >
          Acknowledge & Close
        </button>
      </div>
    </div>
  );
};

