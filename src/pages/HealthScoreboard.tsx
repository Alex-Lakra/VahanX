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
    if (statusBand === 'GREEN') return 'text-emerald-400 stroke-emerald-500';
    if (statusBand === 'AMBER') return 'text-amber-400 stroke-amber-500';
    return 'text-red-500 stroke-red-600 animate-pulse';
  };

  const getBandBadge = () => {
    if (statusBand === 'GREEN') {
      return {
        label: '100 – 80: GREEN (HEALTHY)',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
        action: 'Vehicle operating normally within safe factory tolerance windows. No immediate repair required.',
      };
    }
    if (statusBand === 'AMBER') {
      return {
        label: '79 – 40: AMBER (INSPECT & SCHEDULE REPAIR)',
        badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
        action: 'Moderate component wear, advisory DTC, or thermal drift detected. Open Page 2 to inspect trouble codes.',
      };
    }
    return {
      label: '39 – 0: RED (CRITICAL CARE / LIMP MODE)',
      badgeClass: 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse',
      action: 'Catastrophic mechanical fault active (low oil pressure, thermal boiling). Automated 20 km/h Limp Mode engaged.',
    };
  };

  const bandInfo = getBandBadge();

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-5xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 4: Weighted Vehicle Health Scoreboard (0–100)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-Time Mathematical Synthesis Across 5 Operational Subsystem Buckets
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
          Target: {vehicleType === 'HDV' ? 'Heavy-Duty Agricultural Tractor' : 'Light Passenger Car'}
        </span>
      </div>

      {/* Hero Master Score Gauge */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0b0e18] border-2 border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="stroke-slate-800 stroke-[8] fill-none"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`${getRingColor()} stroke-[8] fill-none transition-all duration-500 ease-out`}
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-mono font-black text-white tracking-tight">
                {score}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                / 100 PTS
              </span>
            </div>
          </div>
        </div>

        {/* Status Interpretation */}
        <div className="space-y-3 flex-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${bandInfo.badgeClass}`}>
              {bandInfo.label}
            </span>
          </div>

          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {bandInfo.action}
          </p>

          <div className="p-3 rounded-xl bg-black/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="text-slate-300 font-bold block uppercase tracking-wider">
              Mathematical Scoring Formula:
            </span>
            <code>HealthScore = max(0, min(100, 100 - Σ(Weight_i × Penalty_i)))</code>
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
                className="p-4 rounded-xl bg-[#0c101c] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
              >
                <div className="space-y-1 sm:w-1/2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">{cat.name}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Weight: {cat.weight}%
                    </span>
                  </div>

                  {cat.deductionReasons.length > 0 ? (
                    <div className="text-[11px] text-red-400 space-y-0.5">
                      {cat.deductionReasons.map((reason, i) => (
                        <div key={i}>• {reason}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Nominal operating limits</span>
                    </div>
                  )}
                </div>

                {/* Progress bar + Points */}
                <div className="flex items-center gap-4 sm:w-1/2 justify-end">
                  <div className="w-full max-w-[200px] bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        cat.score >= 80 ? 'bg-emerald-500' : cat.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="font-bold text-slate-100">{cat.score}/100</span>
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

