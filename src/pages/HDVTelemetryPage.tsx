import React from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import {
  Truck,
  Gauge,
  Scale,
  Disc,
  Flame,
  Wind,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const HDVTelemetryPage: React.FC = () => {
  const hdv = useTelemetryStore((s) => s.hdv);

  const isAirBrakeCritical =
    hdv.airBrakeCircuit1.value < 5.5 || hdv.airBrakeCircuit2.value < 5.5;

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 5: Tractor & Heavy-Duty Specific Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            SAE J1939 High-Frequency Broadcast Frames (Chassis, Air Brakes & AMT Drivetrain)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Port: Deutsch 9-Pin J1939-13
          </span>
        </div>
      </div>

      {/* Critical Air Brake Alert Banner if < 5.5 bar */}
      {isAirBrakeCritical && (
        <div className="p-4 rounded-xl bg-red-950 border-2 border-red-600 text-white flex items-center gap-3 animate-pulse glow-danger">
          <AlertTriangle className="w-6 h-6 text-red-400 shrink-0" />
          <div className="text-xs font-mono">
            <span className="font-bold text-sm uppercase block">
              PNEUMATIC BRAKE PRESSURE CRITICAL (&lt; 5.5 BAR / 80 PSI)
            </span>
            <span>Trailer spring brakes risk immediate lockup. Stop vehicle safely.</span>
          </div>
        </div>
      )}

      {/* SUB-PANEL 1: PNEUMATIC AIR BRAKES (CIRCUITS 1 & 2) */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Wind className="w-5 h-5 text-cyan-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Pneumatic Air Brake Reservoir Pressure (PGN 65198 / SPN 1087 & 1088)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Circuit 1 */}
          <div
            className={`p-4 rounded-xl border-2 flex flex-col justify-between ${
              hdv.airBrakeCircuit1.value < 5.5
                ? 'bg-red-950 border-red-600 animate-critical-flash'
                : 'bg-black/60 border-slate-800 text-white'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-slate-300">
              <span className="font-bold uppercase">Primary Supply Tank (Circuit 1)</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">
                SPN 1087
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-mono font-black">{hdv.airBrakeCircuit1.value.toFixed(1)}</span>
              <span className="text-sm font-mono text-slate-400 uppercase">bar ({Math.round(hdv.airBrakeCircuit1.value * 14.5)} PSI)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Status: {hdv.airBrakeCircuit1.value < 5.5 ? 'CRITICAL LOW' : 'NOMINAL (7.5–8.5 bar)'}
            </div>
          </div>

          {/* Circuit 2 */}
          <div
            className={`p-4 rounded-xl border-2 flex flex-col justify-between ${
              hdv.airBrakeCircuit2.value < 5.5
                ? 'bg-red-950 border-red-600 animate-critical-flash'
                : 'bg-black/60 border-slate-800 text-white'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-slate-300">
              <span className="font-bold uppercase">Secondary Supply Tank (Circuit 2)</span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded">
                SPN 1088
              </span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="text-4xl font-mono font-black">{hdv.airBrakeCircuit2.value.toFixed(1)}</span>
              <span className="text-sm font-mono text-slate-400 uppercase">bar ({Math.round(hdv.airBrakeCircuit2.value * 14.5)} PSI)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Status: {hdv.airBrakeCircuit2.value < 5.5 ? 'CRITICAL LOW' : 'NOMINAL (7.5–8.5 bar)'}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-PANEL 2: AXLE LOAD & AIR SUSPENSION */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Scale className="w-5 h-5 text-amber-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Axle Load Distribution & Suspension Height (PGN 65258 & 61462)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase block">Front Axle Load</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-extrabold text-white">{hdv.axleLoadFront.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">tonnes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Rated Max: 6.0 t</span>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase block">Rear Axle Load</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-extrabold text-white">{hdv.axleLoadRear.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">tonnes</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Rated Max: 10.0 t</span>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-1">
            <span className="text-xs font-mono text-slate-400 uppercase block">Air Suspension Level</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-extrabold text-cyan-400">{hdv.suspensionHeight.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">mm</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Ride Height Trim</span>
          </div>
        </div>
      </div>

      {/* SUB-PANEL 3: TRANSMISSION AMT SYNC & RETARDER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AMT Sync */}
        <div className="p-5 rounded-2xl bg-[#0b0e18] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Disc className="w-5 h-5 text-emerald-400" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              AMT Powershift Synchronizer (PGN 61442)
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Clutch Slip</span>
              <span className="text-2xl font-mono font-extrabold text-white">
                {hdv.amtClutchSlip.value.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Shaft Differential</span>
              <span className="text-2xl font-mono font-extrabold text-cyan-400">
                {hdv.amtShaftSpeedDiff.value} RPM
              </span>
            </div>
          </div>
        </div>

        {/* Retarder / Jake Brake */}
        <div className="p-5 rounded-2xl bg-[#0b0e18] border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
              Compression / Jake-Brake Retarder (PGN 61440)
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Active Mode</span>
              <span className="text-2xl font-mono font-extrabold text-amber-400">
                {hdv.retarderStage === 0 ? 'OFF' : `STAGE ${hdv.retarderStage}`}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-400 block">Retarding Torque</span>
              <span className="text-2xl font-mono font-extrabold text-white">
                {hdv.retarderTorquePct.value}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

