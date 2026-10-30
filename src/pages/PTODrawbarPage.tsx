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
    <div className="min-h-[calc(100vh-80px)] p-3 sm:p-4 max-w-7xl mx-auto space-y-5 font-sans select-none">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cockpit-card p-4 sm:p-5 rounded-2xl border border-[#1b2536]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase">
              PTO, Drawbar & ISOBUS Implement
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Shaft Power Transfer, Draft Force & ISO 11783 Implement Telematics
          </p>
        </div>

        <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-[#090e17] border border-[#1e2a3c] text-cyan-300 font-bold">
          IMPLEMENT BUS: ISO 11783 IN-CAB 9-PIN
        </span>
      </div>

      {/* Warnings Bar */}
      {isPtoSlipHigh && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border border-red-600 text-white flex items-center gap-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span className="text-xs font-mono font-bold tracking-wider">
            WARNING: PTO clutch slip exceeds 10% ({hdv.ptoClutchSlip.value}%). Implement choke or clutch disc glazing hazard!
          </span>
        </div>
      )}

      {/* PANEL 1: POWER TAKE-OFF (PTO) */}
      <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
        <div className="flex items-center justify-between border-b border-[#172130] pb-3">
          <div className="flex items-center gap-2">
            <RotateCw className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Power Take-Off (PTO) Shaft Telematics (PGN 65264)
            </h3>
          </div>
          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            hdv.ptoEngaged ? 'bg-emerald-500/20 text-[#00ff9d] border border-emerald-500/40' : 'bg-[#121a28] text-slate-400'
          }`}>
            {hdv.ptoEngaged ? 'CLUTCH ENGAGED' : 'DISENGAGED'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Shaft Speed</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-black text-white">{hdv.ptoSpeed.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">RPM</span>
            </div>
            <span className="text-[10px] font-mono text-[#00ff9d] block">Target: 540E Mode</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Clutch Slip</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className={`text-3xl font-display font-black ${isPtoSlipHigh ? 'text-red-400' : 'text-white'}`}>
                {hdv.ptoClutchSlip.value.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">%</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Limit: &lt;10.0%</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Shaft Torque</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-black text-white">{hdv.ptoTorque.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">Nm</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Rated Max: 1,450 Nm</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Safety Interlock</span>
            <div className="my-2 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-[#00ff9d]" />
              <span className="text-sm font-mono font-bold text-[#00ff9d]">LOCKED</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">PTO Shield Guard OK</span>
          </div>
        </div>
      </div>

      {/* PANEL 2: DRAWBAR, TOWING & WHEEL SLIP */}
      <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
        <div className="flex items-center justify-between border-b border-[#172130] pb-3">
          <div className="flex items-center gap-2">
            <Anchor className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Drawbar Draft Force & Tractive Traction (Draft Load Pin)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
            DRAWBAR CELL
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Draft Pull Force</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-black text-white">{hdv.drawbarDraftForce.value.toFixed(1)}</span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">kN</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Tillage resistance</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tongue Weight</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-black text-white">{hdv.tongueWeight.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">kg</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Vertical hitch load</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Traction Wheel Slip</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className={`text-3xl font-display font-black ${isWheelSlipHigh ? 'text-amber-400' : 'text-[#00ff9d]'}`}>
                {hdv.wheelSlipPct.value.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">%</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Radar ground vs tire speed</span>
          </div>
        </div>
      </div>

      {/* PANEL 3: ISOBUS IMPLEMENT TELEMATICS */}
      <div className="cockpit-card p-5 rounded-3xl border border-[#1b2536] space-y-4">
        <div className="flex items-center justify-between border-b border-[#172130] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#00ff9d]" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              ISO 11783 Virtual Terminal (ISOBUS Connected Implement)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            VT CLIENT ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Attached Implement</span>
            <span className="text-base font-mono font-bold text-white block mt-1.5">
              {hdv.isobusImplementName}
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-1 block">Width: {hdv.isobusWorkingWidthMeters} m</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Application Rate</span>
            <div className="my-1.5 flex items-baseline gap-1.5">
              <span className="text-3xl font-display font-black text-cyan-400">{hdv.isobusApplicationRate.value}</span>
              <span className="text-xs font-mono text-slate-400 uppercase font-bold">{hdv.isobusApplicationRate.unit}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Prescription target sync</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090e17] border border-[#182333]">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Boom Fold Status</span>
            <div className="my-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#00ff9d]" />
              <span className="text-sm font-mono font-bold text-white">FIELD EXTENDED</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block">Hydraulic wing lock engaged</span>
          </div>
        </div>
      </div>
    </div>
  );
};
