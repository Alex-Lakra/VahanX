import React from 'react';
import { TelemetryValue } from '../types/telemetry';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

  let borderStyle = 'border-[#1b2536] bg-gradient-to-b from-[#101622] to-[#0c111b] text-slate-100 hover:border-[#26354b]';
  let badgeStyle = 'bg-[#151f2e] text-slate-400 border border-[#202d3f]';
  let valueStyle = 'text-white';
  let glowStyle = '';

  if (isCritical) {
    borderStyle = 'border-red-600 bg-gradient-to-b from-red-950/70 to-[#0c111b] animate-critical-flash';
    badgeStyle = 'bg-red-600 text-white font-extrabold shadow-[0_0_8px_rgba(239,68,68,0.7)]';
    valueStyle = 'text-white font-black';
    glowStyle = 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';
  } else if (isWarning) {
    borderStyle = 'border-amber-500/80 bg-gradient-to-b from-amber-950/40 to-[#0c111b]';
    badgeStyle = 'bg-amber-500 text-black font-extrabold shadow-[0_0_8px_rgba(245,158,11,0.7)]';
    valueStyle = 'text-amber-400 font-bold';
    glowStyle = 'shadow-[0_0_16px_rgba(245,158,11,0.25)]';
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
      className={`relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between min-h-[150px] select-none ${borderStyle} ${glowStyle}`}
    >
      {/* Top Header: Number + Label + Status Pill */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {displayNumber && (
            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 bg-[#090e17] border border-[#1b2536]">
              {displayNumber}
            </span>
          )}
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-bold">
            {label}
          </span>
        </div>

        <span
          className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full font-bold ${badgeStyle}`}
        >
          {data.status.toUpperCase()}
        </span>
      </div>

      {/* Main Digital Value */}
      <div className="my-2 flex items-baseline gap-1.5">
        <span className={`text-4xl sm:text-5xl font-display font-extrabold tracking-tight ${valueStyle}`}>
          {formattedValue}
        </span>
        <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
          {data.unit}
        </span>
      </div>

      {/* Footer Status Bar Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-[#172130]">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            isCritical ? 'bg-red-500 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-[#00ff9d]'
          }`} />
          <span>CAN BUS METRIC</span>
        </div>
        <span className={`font-semibold tracking-wider ${
          isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-[#00ff9d]'
        }`}>
          {isCritical ? 'CRITICAL LIMIT' : isWarning ? 'WARNING ELEVATED' : 'NOMINAL RANGE'}
        </span>
      </div>
    </div>
  );
};
