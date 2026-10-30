import React from 'react';
import { useHealthStore } from '../stores/healthStore';
import { useConnectionStore } from '../stores/connectionStore';
import { Activity, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const HealthScoreboard: React.FC = () => {
  const score = useHealthStore((s) => s.score);
  const statusBand = useHealthStore((s) => s.statusBand);
  const categories = useHealthStore((s) => s.categories);
  const vehicleType = useConnectionStore((s) => s.vehicleType);

  const getRingColor = () => {
    if (statusBand === 'GREEN') return 'text-[#00ff9d] stroke-[#00ff9d] drop-shadow-[0_0_12px_rgba(0,255,157,0.7)]';
    if (statusBand === 'AMBER') return 'text-amber-400 stroke-amber-400 drop-shadow-[0_0_12px_rgba(245,158,11,0.7)]';
    return 'text-rose-500 stroke-rose-500 drop-shadow-[0_0_16px_rgba(239,68,68,0.8)] animate-pulse';
  };

  const getBandBadge = () => {
    if (statusBand === 'GREEN') {
      return {
        label: '100 – 80: GREEN (HEALTHY)',
        badgeClass: 'bg-emerald-500/20 text-[#00ff9d] border-emerald-500/50 shadow-[0_0_10px_rgba(0,255,157,0.3)]',
        action: 'All systems nominal within factory safety margins. No scheduled maintenance required.',
      };
    }
    if (statusBand === 'AMBER') {
      return {
        label: '79 – 40: AMBER (INSPECT & SCHEDULE REPAIR)',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
        action: 'Subsystem component degradation or thermal drift detected. Open Diagnostics page to inspect fault telemetry.',
      };
    }
    return {
      label: '39 – 0: RED (CRITICAL CARE / LIMP MODE)',
      badgeClass: 'bg-red-500/20 text-rose-400 border-red-500/50 shadow-[0_0_16px_rgba(239,68,68,0.4)] animate-pulse',
      action: 'Severe powertrain/thermal hazard active. Automatic 20 km/h Limp Mode governor engaged to prevent mechanical failure.',
    };
  };

  const bandInfo = getBandBadge();

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-4 max-w-5xl mx-auto space-y-5 font-sans select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cockpit-card p-4 sm:p-5 rounded-2xl border border-[#1b2536]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
              Vehicle Health Scoreboard (0–100)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-Time Mathematical Synthesis Across 5 Subsystem Buckets
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#090e17] border border-[#1e2a3c] text-slate-300">
          Target: {vehicleType === 'HDV' ? 'Agricultural Tractor (J1939)' : 'Passenger Vehicle (OBD-II)'}
        </span>
      </div>

      {/* Hero Master Score Gauge */}
      <div className="cockpit-card p-6 sm:p-8 rounded-3xl border border-[#1b2536] flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-[#131b28] stroke-[8] fill-none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`${getRingColor()} stroke-[8.5] fill-none transition-all duration-500 ease-out`}
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-display font-extrabold text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {score}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest -mt-1 font-bold">
                / 100 PTS
              </span>
            </div>
          </div>
        </div>

        {/* Status Interpretation */}
        <div className="space-y-3 flex-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${bandInfo.badgeClass}`}>
              {bandInfo.label}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {bandInfo.action}
          </p>

          <div className="p-3.5 rounded-xl bg-[#090e17] border border-[#172232] text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-bold block uppercase tracking-wider">
              Mathematical Synthesis Formula:
            </span>
            <code className="text-[#00ff9d]">HealthScore = max(0, min(100, 100 - Σ(Weight_i × Penalty_i)))</code>
          </div>
        </div>
      </div>

      {/* 5 WEIGHTED CATEGORIES BREAKDOWN */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Subsystem Category Breakdown & Point Deductions
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {categories.map((cat) => {
            const isDeducted = cat.penaltyPoints > 0;
            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl cockpit-card border border-[#1b2536] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1 sm:w-1/2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm tracking-wide">{cat.name}</span>
                    <span className="text-[9px] bg-[#090e17] text-slate-400 px-2 py-0.5 rounded border border-[#182333] font-bold">
                      WEIGHT: {cat.weight}%
                    </span>
                  </div>

                  {cat.deductionReasons.length > 0 ? (
                    <div className="text-[11px] text-rose-400 space-y-0.5">
                      {cat.deductionReasons.map((reason, i) => (
                        <div key={i}>• {reason}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#00ff9d] flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Nominal operating limits</span>
                    </div>
                  )}
                </div>

                {/* Progress bar + Points */}
                <div className="flex items-center gap-4 sm:w-1/2 justify-end">
                  <div className="w-full max-w-[200px] bg-[#090e17] h-2 rounded-full overflow-hidden border border-[#16202e]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        cat.score >= 80 ? 'bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]' : cat.score >= 50 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="font-bold text-slate-100 text-sm">{cat.score}/100</span>
                    <span className="text-[10px] text-slate-500 block">
                      {isDeducted ? `-${cat.penaltyPoints} pts` : '0 pts'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
