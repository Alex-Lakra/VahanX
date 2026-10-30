import React, { useMemo } from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useHealthStore } from '../stores/healthStore';
import { HydraulicsHealthEngine } from '../services/HydraulicsHealthEngine';
import {
  Droplet,
  Gauge,
  Sliders,
  Filter,
  ShieldAlert,
  Activity,
  Layers,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const HydraulicsPage: React.FC = () => {
  const hydraulics = useTelemetryStore((s) => s.hydraulics);
  const setHydraulicsScore = useHealthStore((s) => s.setHydraulicsScore);

  const healthResult = useMemo(() => {
    const res = HydraulicsHealthEngine.evaluate(hydraulics);
    setHydraulicsScore(res.compositeScore);
    return res;
  }, [hydraulics, setHydraulicsScore]);

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-4 max-w-7xl mx-auto space-y-5 font-sans select-none">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cockpit-card p-4 sm:p-5 rounded-2xl border border-[#1b2536]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d4ff]" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
              Tractor Hydraulics System & 9-Part Scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Dedicated 3-Module Live Sub-Dashboard & 9-Component System Integrity Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_10px_rgba(0,212,255,0.25)]">
            HYDRAULICS HEALTH: {healthResult.compositeScore} / 100
          </span>
        </div>
      </div>

      {/* TOP DEDICATED 3-MODULE LIVE TELEMETRY SUB-DASHBOARD */}
      <div className="cockpit-card p-5 rounded-3xl border border-cyan-500/40 space-y-4 shadow-[0_0_20px_rgba(0,212,255,0.15)]">
        <div className="flex items-center justify-between border-b border-[#172130] pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
              Dedicated 3-Module Live Telemetry Sub-Dashboard
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            HIGH-SPEED STREAM (20 HZ)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Module 1: Oil Reservoir Level & Temperature */}
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase tracking-wider">Reservoir Tank</span>
              <Droplet className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Oil Level</span>
                <span className="text-2xl font-display font-black text-white">
                  {hydraulics.reservoirLevel.value}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Oil Temp</span>
                <span className="text-2xl font-display font-black text-amber-400">
                  {hydraulics.reservoirTemp.value}°C
                </span>
              </div>
            </div>

            <div className="w-full bg-[#131b28] h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${hydraulics.reservoirLevel.value}%` }}
              />
            </div>
          </div>

          {/* Module 2: Pump Flow & Pressure */}
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase tracking-wider">Axial Piston Pump</span>
              <Gauge className="w-4 h-4 text-[#00ff9d]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Discharge Flow</span>
                <span className="text-2xl font-display font-black text-white">
                  {hydraulics.pumpFlowRate.value}
                </span>
                <span className="text-[10px] font-mono text-slate-400 ml-1">L/MIN</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Pressure</span>
                <span className="text-2xl font-display font-black text-[#00ff9d]">
                  {hydraulics.pumpDischargePressure.value.toFixed(1)}
                </span>
                <span className="text-[10px] font-mono text-slate-400 ml-1">BAR</span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>VOLUMETRIC EFFICIENCY:</span>
              <span className="font-bold text-[#00ff9d]">{hydraulics.pumpVolumetricEfficiency.value}%</span>
            </div>
          </div>

          {/* Module 3: Selective Control Valves (SCVs) */}
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333] space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-300 uppercase tracking-wider">Control Valves (SCV)</span>
              <Sliders className="w-4 h-4 text-amber-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">SCV 1 Spool</span>
                <span className="text-2xl font-display font-black text-white">
                  {hydraulics.controlValveSCV1.value}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Driver Solenoid</span>
                <span className="text-2xl font-display font-black text-amber-400">
                  {hydraulics.controlValveSolenoidCurrent.value}
                </span>
                <span className="text-[10px] font-mono text-slate-400 ml-1">mA</span>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 flex justify-between">
              <span>SOLENOID CONTROL:</span>
              <span className="font-bold text-[#00ff9d]">PWM CLOSED-LOOP</span>
            </div>
          </div>
        </div>
      </div>

      {/* 9-COMPONENT HYDRAULIC INTEGRITY BREAKDOWN */}
      <div className="space-y-3">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          9-Component Hydraulic System Integrity Matrix
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {healthResult.components.map((comp) => {
            const isCritical = comp.status === 'critical';
            const isWarning = comp.status === 'warning';

            return (
              <div
                key={comp.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCritical
                    ? 'border-red-600 bg-gradient-to-b from-red-950/40 to-[#0c111a]'
                    : isWarning
                    ? 'border-amber-500/80 bg-gradient-to-b from-amber-950/30 to-[#0c111a]'
                    : 'cockpit-card border-[#1b2536]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white tracking-wide text-sm">{comp.name}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        isCritical
                          ? 'bg-red-600 text-white'
                          : isWarning
                          ? 'bg-amber-500 text-black'
                          : 'bg-emerald-500/20 text-[#00ff9d] border border-emerald-500/40'
                      }`}
                    >
                      {comp.score} / 100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-1 leading-relaxed">
                    {comp.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#162130] text-[10px] font-mono">
                  <span className="text-slate-400 block truncate">{comp.metricsSummary}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
