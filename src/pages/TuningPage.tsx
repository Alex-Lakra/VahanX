import React, { useState, useEffect } from 'react';
import { useTuningStore } from '../stores/tuningStore';
import { useConnectionStore } from '../stores/connectionStore';
import { LimpModeController, LimpModeState } from '../services/LimpModeController';
import { WarrantyWaiverModal } from '../components/WarrantyWaiverModal';
import { LimpModeOverlay } from '../components/LimpModeOverlay';
import {
  Sliders,
  Lock,
  Unlock,
  AlertOctagon,
  Gauge,
  Activity,
  Zap,
  ShieldAlert,
  Play,
  RotateCcw,
} from 'lucide-react';

export const TuningPage: React.FC = () => {
  const {
    isUnlocked,
    boostTargetBar,
    peakRpmGovernor,
    throttleSensitivityPct,
    ptoDroopPct,
    setBoostTarget,
    setPeakRpmGovernor,
    setThrottleSensitivity,
    setPtoDroop,
    lock,
  } = useTuningStore();

  const vehicleType = useConnectionStore((s) => s.vehicleType);
  const [isWaiverOpen, setIsWaiverOpen] = useState(false);
  const [limpState, setLimpState] = useState<LimpModeState>(LimpModeController.getState());

  useEffect(() => {
    return LimpModeController.subscribe((s) => {
      setLimpState(s);
    });
  }, []);

  const handleSimulateLimpTrigger = () => {
    LimpModeController.engage('Manual test: Simulated high coolant temperature (>109 °C)');
  };

  const handleResetLimp = () => {
    LimpModeController.overrideLimpMode();
  };

  const isHDV = vehicleType === 'HDV';
  const rpmMax = isHDV ? 2600 : 6500;
  const rpmMin = isHDV ? 1400 : 4000;
  const boostMax = isHDV ? 2.8 : 2.4;

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-5xl mx-auto space-y-6">
      {/* 20 km/h Limp Mode Overlay if active */}
      <LimpModeOverlay />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121e] p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-mono font-black text-white tracking-wider uppercase">
              Page 3: Power-User Tuning & 20 km/h Limp Controller
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Calibrate Boost Target, RPM Governor & Automate Protective Speed Limits
          </p>
        </div>

        <div>
          {isUnlocked ? (
            <button
              onClick={lock}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950 border border-red-700 text-red-300 font-mono text-xs hover:bg-red-900 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Calibration</span>
            </button>
          ) : (
            <button
              onClick={() => setIsWaiverOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg glow-danger transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Unlock ECU Tuning</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: POWER-USER TUNING SLIDERS */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Powertrain Calibration Adjustments
            </h3>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              isUnlocked ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}
          >
            {isUnlocked ? 'UNLOCKED (WAIVER CONFIRMED)' : 'LOCKED (WAIVER REQUIRED)'}
          </span>
        </div>

        {!isUnlocked && (
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Calibration parameters are locked to prevent accidental powertrain damage. Confirm the legal liability waiver to unlock sliders.
            </span>
            <button
              onClick={() => setIsWaiverOpen(true)}
              className="px-3.5 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-500 uppercase shrink-0"
            >
              Sign Waiver
            </button>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isUnlocked ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* 1. Turbo Boost Target */}
          <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase">Turbo Boost Target</span>
              <span className="text-cyan-400 font-extrabold text-sm">{boostTargetBar.toFixed(2)} bar</span>
            </div>
            <input
              type="range"
              min="1.0"
              max={boostMax}
              step="0.05"
              value={boostTargetBar}
              onChange={(e) => setBoostTarget(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Stock: 1.40 bar</span>
              <span>Max Safe: {boostMax} bar</span>
            </div>
          </div>

          {/* 2. Peak RPM Governor Limit */}
          <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase">Peak RPM Governor</span>
              <span className="text-amber-400 font-extrabold text-sm">{peakRpmGovernor} RPM</span>
            </div>
            <input
              type="range"
              min={rpmMin}
              max={rpmMax}
              step="50"
              value={peakRpmGovernor}
              onChange={(e) => setPeakRpmGovernor(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Min: {rpmMin} RPM</span>
              <span>Ceiling: {rpmMax} RPM</span>
            </div>
          </div>

          {/* 3. Throttle Map Sensitivity */}
          <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-slate-800">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-bold uppercase">Pedal Map Sensitivity</span>
              <span className="text-emerald-400 font-extrabold text-sm">{throttleSensitivityPct}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              step="5"
              value={throttleSensitivityPct}
              onChange={(e) => setThrottleSensitivity(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Eco: 50%</span>
              <span>Linear: 100%</span>
              <span>Aggressive: 150%</span>
            </div>
          </div>

          {/* 4. PTO Torque Droop Curve (HDV only) */}
          {isHDV && (
            <div className="space-y-2 p-4 rounded-xl bg-black/40 border border-slate-800">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-300 font-bold uppercase">PTO Torque Droop Curve</span>
                <span className="text-purple-400 font-extrabold text-sm">{ptoDroopPct}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={ptoDroopPct}
                onChange={(e) => setPtoDroop(parseInt(e.target.value, 10))}
                className="w-full accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Tight Isochronous (5%)</span>
                <span>Standard (10%)</span>
                <span>Soft (25%)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: AUTOMATED 20 KM/H LIMP MODE CONTROLLER */}
      <div className="bg-[#0b0e18] p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-wider">
              Automated 20 km/h Limp Mode Engine
            </h3>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
              limpState.isActive
                ? 'bg-red-600 text-white animate-pulse'
                : limpState.isOverridden
                ? 'bg-amber-500 text-black'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {limpState.isActive ? 'ACTIVE GOVERNOR' : limpState.isOverridden ? 'OVERRIDDEN' : 'ARMED / STANDBY'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          When catastrophic damage conditions are detected (e.g. oil pressure loss, coolant boiling, brake pressure drop),
          the controller broadcasts J1939 TSC1 (PGN 0) override frames every 10 ms to cap speed at 20 km/h and engine RPM at 1,200.
        </p>

        {/* J1939 Frame Inspector */}
        <div className="p-3 bg-black/70 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-500 block">
            J1939 TSC1 Command Frame (PGN 0 Speed / Torque Governor):
          </span>
          <code className="text-xs font-mono text-cyan-300 block">
            {LimpModeController.buildJ1939TSC1Frame(20, 1200)}
          </code>
        </div>

        {/* Test Trigger / Override Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleSimulateLimpTrigger}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-red-950 border border-red-700 text-red-300 hover:bg-red-900 font-mono text-xs font-bold uppercase transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate Limp Trigger</span>
          </button>

          {limpState.isActive && (
            <button
              onClick={handleResetLimp}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bypass / Override Limp Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Legal Waiver Modal */}
      <WarrantyWaiverModal isOpen={isWaiverOpen} onClose={() => setIsWaiverOpen(false)} />
    </div>
  );
};

