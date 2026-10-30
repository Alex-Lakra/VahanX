import React from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import {
  Truck,
  Scale,
  Disc,
  Flame,
  Wind,
  AlertTriangle,
} from 'lucide-react';

export const HDVTelemetryPage: React.FC = () => {
  const hdv = useTelemetryStore((s) => s.hdv);

  const isAirBrakeCritical =
    hdv.airBrakeCircuit1.value < 5.5 || hdv.airBrakeCircuit2.value < 5.5;

  return (
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-4 max-w-7xl mx-auto space-y-5 font-sans select-none">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cockpit-card p-4 sm:p-5 rounded-2xl border border-[#1b2536]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
              Tractor & Heavy-Duty Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            SAE J1939 High-Frequency Broadcast Frames (Chassis, Air Brakes & AMT Drivetrain)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#090e17] border border-[#1e2a3c] text-amber-300 font-bold">
            PORT: DEUTSCH 9-PIN J1939-13
          </span>
        </div>
      </div>

      {/* Critical Air Brake Alert Banner if < 5.5 bar */}
      {isAirBrakeCritical && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border-2 border-red-600 text-white flex items-center gap-3 animate-pulse shadow-[0_0_25px_rgba(239,68,68,0.5)]">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <div className="text-xs font-mono">
            <span className="font-bold text-sm uppercase block tracking-wider">
              PNEUMATIC BRAKE PRESSURE CRITICAL (&lt; 5.5 BAR / 80 PSI)
            </span>
            <span className="text-slate-200">Trailer spring brakes risk immediate lockup. Stop vehicle safely.</span>
          </div>
        </div>
      )}

      {/* SUB-PANEL 1: PNEUMATIC AIR BRAKES (CIRCUITS 1 & 2) */}
      <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
        <div className="flex items-center justify-between border-b border-[#172130] pb-3">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Pneumatic Air Brake Reservoir Pressure (PGN 65198 / SPN 1087 & 1088)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            DUAL TANK PNEUMATICS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Circuit 1 */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] ${
              hdv.airBrakeCircuit1.value < 5.5
                ? 'bg-gradient-to-b from-red-950/80 to-[#0c111a] border-red-600 animate-critical-flash'
                : 'bg-[#090e17] border-[#182333] text-white hover:border-[#223249]'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-slate-300">
              <span className="font-bold uppercase tracking-wider">Primary Supply Tank (Circuit 1)</span>
              <span className="text-[10px] bg-[#111927] border border-[#1d293d] px-2 py-0.5 rounded text-slate-400">
                SPN 1087
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-display font-black tracking-tight text-white">{hdv.airBrakeCircuit1.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">bar ({Math.round(hdv.airBrakeCircuit1.value * 14.5)} PSI)</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-[#152030]">
              <span>STATUS:</span>
              <span className={`font-bold ${hdv.airBrakeCircuit1.value < 5.5 ? 'text-red-400' : 'text-[#00ff9d]'}`}>
                {hdv.airBrakeCircuit1.value < 5.5 ? 'CRITICAL LOW' : 'NOMINAL (7.5–8.5 bar)'}
              </span>
            </div>
          </div>

          {/* Circuit 2 */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[140px] ${
              hdv.airBrakeCircuit2.value < 5.5
                ? 'bg-gradient-to-b from-red-950/80 to-[#0c111a] border-red-600 animate-critical-flash'
                : 'bg-[#090e17] border-[#182333] text-white hover:border-[#223249]'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-slate-300">
              <span className="font-bold uppercase tracking-wider">Secondary Supply Tank (Circuit 2)</span>
              <span className="text-[10px] bg-[#111927] border border-[#1d293d] px-2 py-0.5 rounded text-slate-400">
                SPN 1088
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-display font-black tracking-tight text-white">{hdv.airBrakeCircuit2.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">bar ({Math.round(hdv.airBrakeCircuit2.value * 14.5)} PSI)</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-2 border-t border-[#152030]">
              <span>STATUS:</span>
              <span className={`font-bold ${hdv.airBrakeCircuit2.value < 5.5 ? 'text-red-400' : 'text-[#00ff9d]'}`}>
                {hdv.airBrakeCircuit2.value < 5.5 ? 'CRITICAL LOW' : 'NOMINAL (7.5–8.5 bar)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-PANEL 2: AXLE LOAD & AIR SUSPENSION */}
      <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
        <div className="flex items-center justify-between border-b border-[#172130] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Axle Load Distribution & Suspension Height (PGN 65258 & 61462)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            MASS & LEVELING
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333] space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Front Axle Load</span>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-3xl font-display font-extrabold text-white">{hdv.axleLoadFront.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">tonnes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Rated Max: 6.0 t</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333] space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Rear Axle Load</span>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-3xl font-display font-extrabold text-white">{hdv.axleLoadRear.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">tonnes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Rated Max: 10.0 t</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333] space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Air Suspension Level</span>
            <div className="flex items-baseline gap-1.5 my-1">
              <span className="text-3xl font-display font-extrabold text-cyan-400">{hdv.suspensionHeight.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">mm</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Ride Height Trim</span>
          </div>
        </div>
      </div>

      {/* SUB-PANEL 3: TRANSMISSION AMT SYNC & RETARDER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AMT Sync */}
        <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-3">
          <div className="flex items-center justify-between border-b border-[#172130] pb-2.5">
            <div className="flex items-center gap-2">
              <Disc className="w-5 h-5 text-[#00ff9d]" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                AMT Powershift Synchronizer (PGN 61442)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-[#00ff9d]">ACTIVE</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#090e17] border border-[#162130]">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Clutch Slip</span>
              <span className="text-2xl font-display font-black text-white">
                {hdv.amtClutchSlip.value.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#090e17] border border-[#162130]">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Shaft Diff</span>
              <span className="text-2xl font-display font-black text-cyan-400">
                {hdv.amtShaftSpeedDiff.value} RPM
              </span>
            </div>
          </div>
        </div>

        {/* Retarder / Jake Brake */}
        <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-3">
          <div className="flex items-center justify-between border-b border-[#172130] pb-2.5">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500" />
              <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                Compression / Retarder (PGN 61440)
              </h4>
            </div>
            <span className="text-[10px] font-mono text-amber-400">JAKE BRAKE</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-[#090e17] border border-[#162130]">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Active Mode</span>
              <span className="text-2xl font-display font-black text-amber-400">
                {hdv.retarderStage === 0 ? 'OFF' : `STAGE ${hdv.retarderStage}`}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#090e17] border border-[#162130]">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Torque Ratio</span>
              <span className="text-2xl font-display font-black text-white">
                {hdv.retarderTorquePct.value}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
