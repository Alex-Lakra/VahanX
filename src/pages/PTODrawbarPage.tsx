import React from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import {
  RotateCw,
  Anchor,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

export const PTODrawbarPage: React.FC = () => {
  const hdv = useTelemetryStore((s) => s.hdv);

  const isPtoSlipHigh = hdv.ptoClutchSlip.value > 10;
  const isWheelSlipHigh = hdv.wheelSlipPct.value > 15;

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-7xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 6: Power Take-Off (PTO), Drawbar & ISOBUS Implement
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Mechanical Shaft Power Transfer, Draft Force & ISO 11783 Implement Telematics
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
          Implement Bus: ISO 11783 In-Cab 9-Pin
        </span>
      </div>

      {/* Warnings Bar */}
      {isPtoSlipHigh && (
        <div className="p-3.5 rounded-xl bg-red-950 border border-red-600 text-white flex items-center gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-mono font-bold">
            WARNING: PTO clutch slip exceeds 10% ({hdv.ptoClutchSlip.value}%). Implement choke or clutch disc glazing hazard!
          </span>
        </div>
      )}

      {/* PANEL 1: POWER TAKE-OFF (PTO) */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Power Take-Off (PTO) Shaft Telematics (PGN 65264)
            </h3>
          </div>
          <span
            className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
              hdv.ptoEngaged ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {hdv.ptoEngaged ? 'ENGAGED' : 'DISENGAGED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PTO Speed */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase block">PTO Shaft Speed</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-white">{hdv.ptoSpeed.value}</span>
              <span className="text-xs font-mono text-slate-400">RPM</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Rated Target: 540 RPM</span>
          </div>

          {/* PTO Clutch Slip */}
          <div
            className={`p-4 rounded-xl border ${
              isPtoSlipHigh ? 'bg-red-950/60 border-red-600 text-white' : 'bg-black/60 border-slate-800'
            }`}
          >
            <span className="text-xs font-mono text-slate-400 uppercase block">Clutch Slip</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-black ${isPtoSlipHigh ? 'text-red-400' : 'text-emerald-400'}`}>
                {hdv.ptoClutchSlip.value}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Max Allowable: 10%</span>
          </div>

          {/* PTO Torque */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase block">Transmitted Torque</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-white">{hdv.ptoTorque.value}</span>
              <span className="text-xs font-mono text-slate-400">Nm</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Dynamic Shaft Load</span>
          </div>

          {/* Safety Guard Interlock */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 flex flex-col justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase block">PTO Shield Guard</span>
            <div className="flex items-center gap-2 my-2">
              {hdv.ptoShieldInterlock ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span className="text-sm font-mono font-bold text-emerald-400">LOCKED & SAFE</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                  <span className="text-sm font-mono font-bold text-red-400">SHIELD OPEN</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-500">Cab Interlock Status</span>
          </div>
        </div>
      </div>

      {/* PANEL 2: DRAWBAR & TOWING LOAD */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Anchor className="w-5 h-5 text-amber-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Drawbar Draft Pulling Force & Wheel Slip
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Draft Force */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase block">Draft Pulling Force</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-white">{hdv.drawbarDraftForce.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">kN</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Lower Link Pin Strain Feedback</span>
          </div>

          {/* Tongue Weight */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase block">Tongue Vertical Load</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-white">{hdv.tongueWeight.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase">kg</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Static Drawbar Downforce</span>
          </div>

          {/* Wheel Slip % */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <span className="text-xs font-mono text-slate-400 uppercase block">Tractor Drive Wheel Slip</span>
            <div className="my-2 flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-black ${isWheelSlipHigh ? 'text-amber-400' : 'text-emerald-400'}`}>
                {hdv.wheelSlipPct.value}%
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Radar Ground Speed vs Wheel Axle</span>
          </div>
        </div>
      </div>

      {/* PANEL 3: ISOBUS AGRICULTURAL IMPLEMENT */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
            Connected Implement Telematics (ISOBUS ISO 11783)
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400 uppercase block">
              Working Set Master (Implement ID)
            </span>
            <h4 className="text-base font-mono font-extrabold text-white">
              {hdv.isobusImplementName}
            </h4>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-1">
              <span>Working Width: <strong className="text-slate-200">{hdv.isobusWorkingWidthMeters} m</strong></span>
              <span>•</span>
              <span>Section Control: <strong className="text-emerald-400">ACTIVE</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Fold Lock</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center">
                <Lock className="w-3 h-3" />
                ENGAGED
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

