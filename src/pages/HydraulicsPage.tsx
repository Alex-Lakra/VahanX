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
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 7: Tractor Hydraulics System & 9-Part Scorecard
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Dedicated 3-Module Live Sub-Dashboard & Comprehensive 9-Component System Integrity Matrix
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
            Hydraulics Health: {healthResult.compositeScore} / 100
          </span>
        </div>
      </div>

      {/* TOP DEDICATED 3-MODULE LIVE TELEMETRY SUB-DASHBOARD */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border-2 border-cyan-500/40 space-y-4 glow-accent">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
              Dedicated 3-Module Live Telemetry Sub-Dashboard
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            High-Speed Stream (20 Hz)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Module 1: Hydraulic Oil Reservoir */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-mono text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-cyan-400" />
                1. Hydraulic Reservoir
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                HEALTHY
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Fluid Level:</span>
                <span className="text-xl font-bold text-white">
                  {hydraulics.reservoirLevel.value}%
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Oil Temp:</span>
                <span className="text-xl font-bold text-amber-300">
                  {hydraulics.reservoirTemp.value} °C
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Moisture / Aeration:</span>
                <span className="text-xs font-bold text-emerald-400">
                  {hydraulics.reservoirMoistureAeration}
                </span>
              </div>
            </div>
          </div>

          {/* Module 2: Hydraulic Pump */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-mono text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-amber-400" />
                2. Hydraulic Pump
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                HEALTHY
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Discharge Flow:</span>
                <span className="text-xl font-bold text-white">
                  {hydraulics.pumpFlowRate.value} L/min
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Pressure:</span>
                <span className="text-xl font-bold text-cyan-300">
                  {hydraulics.pumpDischargePressure.value} bar
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Drive Torque:</span>
                <span className="text-xs font-bold text-slate-200">
                  {hydraulics.pumpDriveTorque.value} Nm
                </span>
              </div>
            </div>
          </div>

          {/* Module 3: Control Valve (SCVs) */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-mono text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                3. Control Valve
              </span>
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">SCV 1 Spool:</span>
                <span className="text-xl font-bold text-emerald-400">
                  +{hydraulics.controlValveSCV1.value}% EXT
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">SCV 2 Spool:</span>
                <span className="text-xl font-bold text-slate-300">
                  {hydraulics.controlValveSCV2.value}% (NEUTRAL)
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Solenoid Current:</span>
                <span className="text-xs font-bold text-slate-200">
                  {hydraulics.controlValveSolenoidCurrent.value} mA
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9-COMPONENT HYDRAULICS HEALTH SCORECARD */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              9-Component Hydraulics Health Matrix (Feeds Master Score Category C)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Points: 100
          </span>
        </div>

        <div className="space-y-3">
          {healthResult.components.map((comp, idx) => {
            const isCritical = comp.status === 'critical';
            const isWarning = comp.status === 'warning';

            return (
              <div
                key={comp.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono transition-colors ${
                  isCritical
                    ? 'border-red-600 bg-red-950/30'
                    : isWarning
                    ? 'border-amber-500/60 bg-amber-950/20'
                    : 'border-slate-800/80 bg-black/40'
                }`}
              >
                <div className="space-y-1 sm:w-1/2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200 text-sm">
                      {idx + 1}. {comp.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Weight: {comp.weight}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">{comp.description}</p>
                  <p className="text-[11px] text-cyan-300 font-mono">{comp.metricsSummary}</p>
                </div>

                <div className="flex items-center gap-4 sm:w-1/2 justify-end">
                  <div className="w-full max-w-[200px] bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        comp.score >= 80 ? 'bg-emerald-500' : comp.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${comp.score}%` }}
                    />
                  </div>
                  <div className="text-right min-w-[70px]">
                    <span className="font-bold text-slate-100 text-sm">{comp.score}/100</span>
                    <span
                      className={`text-[9px] uppercase font-bold block ${
                        isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {comp.status}
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

