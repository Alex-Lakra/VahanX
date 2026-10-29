import React from 'react';
import { TelemetryValue } from '../types/telemetry';

interface TelemetryCardProps {
  label: string;
  variableKey: string;
  data: TelemetryValue;
  displayNumber?: number;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  label,
  variableKey,
  data,
  displayNumber,
}) => {
  const isCritical = data.status === 'critical';
  const isWarning = data.status === 'warning';

  let borderStyle = 'border-slate-800 bg-[#0f1420] text-slate-100';
  let badgeStyle = 'bg-slate-800 text-slate-300';
  let valueStyle = 'text-white';

  if (isCritical) {
    borderStyle = 'border-red-600 bg-red-950/80 animate-critical-flash';
    badgeStyle = 'bg-red-600 text-white font-bold';
    valueStyle = 'text-white font-black';
  } else if (isWarning) {
    borderStyle = 'border-amber-500/80 bg-amber-950/40 glow-amber';
    badgeStyle = 'bg-amber-500 text-black font-bold';
    valueStyle = 'text-amber-400 font-bold';
  }

  // Format value representation
  let formattedValue = String(data.value);
  if (typeof data.value === 'number') {
    if (data.unit === 'RPM' || data.unit === 'km' || data.unit === 'hrs') {
      formattedValue = Math.round(data.value).toLocaleString();
    } else if (data.unit === 'bar' || data.unit === 'V') {
      formattedValue = data.value.toFixed(1);
    } else {
      formattedValue = String(data.value);
    }
  }

  return (
    <div
      className={`relative p-4 rounded-xl border-2 flex flex-col justify-between transition-all duration-150 min-h-[140px] select-none ${borderStyle}`}
    >
      {/* Top Header: Number + Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {displayNumber && (
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
              {displayNumber}
            </span>
          )}
          <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            {label}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full ${badgeStyle}`}
        >
          {data.status.toUpperCase()}
        </span>
      </div>

      {/* Main Digital Value */}
      <div className="my-2 flex items-baseline gap-1.5">
        <span className={`text-4xl sm:text-5xl font-mono font-extrabold tracking-tight ${valueStyle}`}>
          {formattedValue}
        </span>
        <span className="text-sm font-mono font-semibold text-slate-400 uppercase">
          {data.unit}
        </span>
      </div>

      {/* Footer Status Bar Indicator */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
        <span>PID / SPN</span>
        <span className="text-slate-300 font-medium">
          {isCritical ? '⚠️ BREACH' : isWarning ? '⚡ ELEVATED' : '✓ NOMINAL'}
        </span>
      </div>
    </div>
  );
};

