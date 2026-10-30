import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useHealthStore } from '../stores/healthStore';
import { useDTCStore } from '../stores/dtcStore';
import { useConnectionStore } from '../stores/connectionStore';
import {
  Fuel,
  Thermometer,
  Zap,
  Battery,
  ArrowLeft,
  ArrowRight,
  Eye,
  Radio,
  Disc,
} from 'lucide-react';

interface CockpitClusterProps {
  onSwitchView?: () => void;
}

export const CockpitCluster: React.FC<CockpitClusterProps> = ({ onSwitchView }) => {
  const core = useTelemetryStore((s) => s.core);
  const vehicleType = useConnectionStore((s) => s.vehicleType);
  const masterScore = useHealthStore((s) => s.score);
  const activeFaults = useDTCStore((s) => s.activeFaults);

  // Cockpit interactive state
  const [isDigitalOnly, setIsDigitalOnly] = useState(false);
  const [driveMode, setDriveMode] = useState<'ECO' | 'COMFORT' | 'SPORT' | 'SPORT+' | 'WORK'>('SPORT+');
  const [gear, setGear] = useState<'P' | 'R' | 'N' | 'D'>('D');
  const [autoHigh, setAutoHigh] = useState(true);
  const [sigLeft, setSigLeft] = useState(false);
  const [sigRight, setSigRight] = useState(false);
  const [timeStr, setTimeStr] = useState('10:42 AM');

  // Live clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Compute live values with fallback defaults
  const currentSpeed = Math.round(core.speed.value || 0);
  const coolantVal = Math.round(core.coolantTemp.value || 90);
  const boostVal = Number((core.boostGauge.value || 1.2).toFixed(2));
  const mileageVal = Math.round(core.totalDistance.value ?? 200);
  const battVoltage = Number((core.systemVoltage.value || 12.7).toFixed(1));
  const battSoC = Math.round(core.batterySoC.value || 98);

  // Dynamic Gear calculation based on speed
  useEffect(() => {
    if (currentSpeed === 0) setGear('P');
    else setGear('D');
  }, [currentSpeed]);

  // ====================================================================
  // MATHEMATICALLY PRECISE SPEEDOMETER GAUGE CALCULATIONS
  // Center (160, 160) in a 320x320 SVG viewport
  // Arc radius: 108
  // Sweep angle: 240 degrees (from -120° at bottom-left to +120° at bottom-right)
  // Milestone 0 km/h: -120° (bottom-left)
  // Milestone 120 km/h: 0° (top center)
  // Milestone 240 km/h: +120° (bottom-right)
  // Total arc length = 2 * PI * 108 * (240 / 360) = 452.389
  // ====================================================================
  const maxSpeed = 240;
  const clampedSpeed = Math.max(0, Math.min(maxSpeed, currentSpeed));
  const speedRatio = clampedSpeed / maxSpeed;
  const totalArcLength = 452.39;
  const strokeOffset = totalArcLength * (1 - speedRatio);

  // Milestone points
  const milestones = [0, 40, 80, 120, 160, 200, 240];

  // Helper function to calculate cartesian (x, y) coordinates from milestone speed
  const getMilestoneCoords = (speedVal: number, radius: number) => {
    const angleDeg = -120 + speedVal; // Angle where 0 is top (12 o'clock), -120 is lower-left
    const rad = (angleDeg * Math.PI) / 180;
    const x = 160 + radius * Math.sin(rad);
    const y = 160 - radius * Math.cos(rad);
    return { x, y, angleDeg };
  };

  // Segmented Bar Calculation (8 bars)
  const totalBars = 8;
  const fuelPct = battSoC || 78;
  const fuelLitCount = Math.max(1, Math.round((fuelPct / 100) * totalBars));

  // Coolant: safe window 60-110°C
  const coolantRatio = Math.min(1, Math.max(0, (coolantVal - 40) / 75));
  const coolantLitCount = Math.max(1, Math.round(coolantRatio * totalBars));

  // Boost circular ring percentage (0 to 2.5 bar -> pct)
  const boostMax = vehicleType === 'HDV' ? 2.8 : 2.0;
  const boostRatio = Math.min(1, Math.max(0, boostVal / boostMax));
  const boostPct = Math.round(boostRatio * 100) || 82;

  // Component Health breakdown dynamically driven by masterScore
  const powertrainHealth = Math.min(100, Math.max(10, masterScore));
  const turboHealth = Math.min(100, Math.max(10, Math.round(masterScore * 0.82)));
  const auxHealth = Math.min(100, Math.max(10, Math.round(masterScore * 0.45)));

  const cycleDriveMode = () => {
    const modes: ('ECO' | 'COMFORT' | 'SPORT' | 'SPORT+' | 'WORK')[] = [
      'ECO',
      'COMFORT',
      'SPORT',
      'SPORT+',
      'WORK',
    ];
    const nextIdx = (modes.indexOf(driveMode) + 1) % modes.length;
    setDriveMode(modes[nextIdx]);
  };

  return (
    <div className="w-full select-none font-sans text-slate-200">
      {/* Outer Cockpit Bezel Housing */}
      <div className="cockpit-bezel p-3 sm:p-5 rounded-3xl border border-[#1a2538] shadow-2xl relative overflow-hidden">
        
        {/* Subtle Ambient Vignette & Cockpit Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131c2d]/40 via-transparent to-transparent pointer-events-none" />

        {/* ============================================================== */}
        {/* TOP STATUS SUB-BAR (Inside Cockpit Bezel)                      */}
        {/* ============================================================== */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 mb-4 border-b border-[#1b2537] text-xs font-mono">
          {/* Left: Signals, Mode, Gear Selector (P R N D only) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Left Signal */}
            <button
              onClick={() => setSigLeft(!sigLeft)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold tracking-wider transition-all ${
                sigLeft
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 animate-signal'
                  : 'border-[#1e2a3c] bg-[#0c111a] text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Left Turn Indicator"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>SIG L</span>
            </button>

            {/* Drive Mode Pill */}
            <button
              onClick={cycleDriveMode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[11px] font-bold tracking-widest transition-all"
              title="Click to cycle drive mode"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{driveMode}</span>
            </button>

            {/* PRND Gear Box (P R N D only) */}
            <div className="flex items-center gap-1 bg-[#090e17] px-2 py-0.5 rounded-md border border-[#182232] text-[11px] font-bold tracking-widest">
              {(['P', 'R', 'N', 'D'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGear(g)}
                  className={`px-1.5 py-0.5 rounded transition-all ${
                    gear === g
                      ? 'bg-[#00ff9d] text-black font-black shadow-[0_0_8px_rgba(0,255,157,0.7)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Headlights, Temp, Time, Right Signal */}
          <div className="flex items-center gap-2 sm:gap-4 text-slate-400">
            {/* Auto High Beams */}
            <button
              onClick={() => setAutoHigh(!autoHigh)}
              className={`hidden sm:flex items-center gap-1.5 text-[11px] font-semibold tracking-wider ${
                autoHigh ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>AUTO HIGH</span>
            </button>

            {/* Outside Temp */}
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
              <Thermometer className="w-3.5 h-3.5 text-slate-400" />
              <span>22.0°C</span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-200 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>{timeStr}</span>
            </div>

            {/* Right Signal */}
            <button
              onClick={() => setSigRight(!sigRight)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-[11px] font-bold tracking-wider transition-all ${
                sigRight
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 animate-signal'
                  : 'border-[#1e2a3c] bg-[#0c111a] text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Right Turn Indicator"
            >
              <span>SIG R</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN COCKPIT 3-COLUMN DISPLAY GRID                             */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch">
          
          {/* ============================================================ */}
          {/* COLUMN 1 (5 cols): DOMINANT SPEEDOMETER ARC GAUGE CARD       */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 cockpit-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
            {/* Card Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]" />
                <h3 className="font-mono text-xs font-bold tracking-widest text-slate-200 uppercase">
                  SPEEDOMETER
                </h3>
              </div>
              <button
                onClick={() => setIsDigitalOnly(!isDigitalOnly)}
                className="text-[10px] font-mono tracking-wider text-slate-400 hover:text-[#00ff9d] transition-colors border border-[#1e2a3c] px-2 py-0.5 rounded-full bg-[#0a0f17]"
              >
                {isDigitalOnly ? 'DIGITAL ONLY' : 'ANALOG / DIGITAL'}
              </button>
            </div>

            {/* Gauge Arc Graphic & Digital Readout */}
            <div className="relative flex items-center justify-center py-2 my-auto min-h-[280px]">
              {/* Perfectly Aligned SVG Speedometer */}
              <svg className="w-72 h-72 sm:w-80 sm:h-80 overflow-visible" viewBox="0 0 320 320">
                <defs>
                  {/* Gauge active stroke gradient */}
                  <linearGradient id="speedGaugeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="45%" stopColor="#00ff9d" />
                    <stop offset="80%" stopColor="#ffaa00" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>

                  <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Concentric Inner Dotted Hash Ring */}
                <path
                  d="M 82.06 205.0 A 90 90 0 1 1 237.94 205.0"
                  fill="none"
                  stroke="#162234"
                  strokeWidth="2"
                  strokeDasharray="3 6"
                />

                {/* Background Gauge Track (240° sweep from lower-left to lower-right) */}
                <path
                  d="M 66.47 214.0 A 108 108 0 1 1 253.53 214.0"
                  fill="none"
                  stroke="#131c2a"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* Active Dynamic Speed Stroke */}
                {!isDigitalOnly && (
                  <path
                    d="M 66.47 214.0 A 108 108 0 1 1 253.53 214.0"
                    fill="none"
                    stroke="url(#speedGaugeGradient)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="452.39"
                    strokeDashoffset={strokeOffset}
                    filter="url(#glowFilter)"
                    className="transition-all duration-300 ease-out"
                  />
                )}

                {/* Radial Milestone Ticks */}
                {milestones.map((val) => {
                  const ptIn = getMilestoneCoords(val, 97);
                  const ptOut = getMilestoneCoords(val, 107);
                  const isApex = val === 120;
                  return (
                    <line
                      key={`tick-${val}`}
                      x1={ptIn.x}
                      y1={ptIn.y}
                      x2={ptOut.x}
                      y2={ptOut.y}
                      stroke={isApex ? '#ffaa00' : '#223247'}
                      strokeWidth={isApex ? 3 : 2}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Milestone Speed Text Labels */}
                {milestones.map((val) => {
                  const ptLabel = getMilestoneCoords(val, 126);
                  const isApex = val === 120;
                  const isRedLine = val === 240;
                  return (
                    <text
                      key={`lbl-${val}`}
                      x={ptLabel.x}
                      y={ptLabel.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`font-mono text-[11px] font-bold ${
                        isApex
                          ? 'fill-amber-400 font-extrabold'
                          : isRedLine
                          ? 'fill-rose-400'
                          : 'fill-slate-400'
                      }`}
                    >
                      {val}
                    </text>
                  );
                })}
              </svg>

              {/* Centered Digital Speed Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-6xl sm:text-7xl font-display font-extrabold text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                  {currentSpeed}
                </span>
                <span className="text-xs font-mono font-bold tracking-[0.25em] text-slate-400 uppercase -mt-1">
                  KM / H
                </span>
                <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9d] animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#00ff9d] uppercase">
                    READY
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer: Est. Range & Efficiency */}
            <div className="flex items-center justify-between pt-3 border-t border-[#172130] text-xs font-mono">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-[10px] text-slate-500 block leading-none">EST. RANGE</span>
                  <span className="font-bold text-slate-200 text-sm">
                    {vehicleType === 'HDV' ? '18.5 HRS' : '580 KM'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block leading-none">EFFICIENCY</span>
                <span className="font-bold text-[#00ff9d] text-sm tracking-wide">
                  +18.4% ECO
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUMN 2 (4 cols): CENTER MULTI-CARD STACK                   */}
          {/* ============================================================ */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            
            {/* ROW 1: TWO MINI CARDS (FUEL & COOLANT) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: Fuel Level */}
              <div className="cockpit-card rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                    <Fuel className="w-3.5 h-3.5 text-[#00ff9d]" />
                    <span>FUEL</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-[#00ff9d]">
                    {fuelPct}%
                  </span>
                </div>

                {/* 8 Segmented Vertical LED Bars */}
                <div className="flex items-end justify-between gap-1 my-3 h-10 px-1">
                  {Array.from({ length: totalBars }).map((_, i) => {
                    const isLit = i < fuelLitCount;
                    return (
                      <div
                        key={i}
                        className={`w-full rounded-sm led-bar ${
                          isLit ? 'led-bar-lit-green' : 'led-bar-unlit'
                        }`}
                        style={{ height: `${55 + i * 6}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#172130]">
                  <span>RESERVE</span>
                  <span className="text-slate-200 font-bold">44.5 L</span>
                </div>
              </div>

              {/* Card 2: Engine Coolant Temp */}
              <div className="cockpit-card rounded-2xl p-3.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    <span>COOLANT</span>
                  </div>
                  <span className="text-xs font-mono font-extrabold text-amber-400">
                    {coolantVal}°C
                  </span>
                </div>

                {/* 8 Segmented Vertical LED Bars */}
                <div className="flex items-end justify-between gap-1 my-3 h-10 px-1">
                  {Array.from({ length: totalBars }).map((_, i) => {
                    const isLit = i < coolantLitCount;
                    return (
                      <div
                        key={i}
                        className={`w-full rounded-sm led-bar ${
                          isLit ? 'led-bar-lit-amber' : 'led-bar-unlit'
                        }`}
                        style={{ height: `${55 + i * 6}%` }}
                      />
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-[#172130]">
                  <span>OPTIMAL</span>
                  <span className="text-slate-200 font-bold">NOMINAL</span>
                </div>
              </div>
            </div>

            {/* ROW 2: TOTAL VEHICLE MILEAGE / ODOMETER CARD */}
            <div className="cockpit-card rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  TOTAL VEHICLE MILEAGE
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border border-[#24334a] text-slate-300 bg-[#0c121d]">
                  ODOMETER
                </span>
              </div>

              <div className="my-2 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">
                    {mileageVal.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-xs font-mono text-slate-400 font-semibold uppercase">
                    {vehicleType === 'HDV' ? 'HRS' : 'KM'}
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-widest text-[#00ff9d] uppercase">
                  CALIBRATED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#172130] text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">TRIP A</span>
                  <span className="font-bold text-slate-300">421.8 KM</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block text-[10px]">AVG CONSUMPTION</span>
                  <span className="font-bold text-slate-300">
                    {vehicleType === 'HDV' ? '12.4 L / H' : '6.8 L / 100'}
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 3: TURBOCHARGER BOOST CARD */}
            <div className="cockpit-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  TURBOCHARGER BOOST
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-display font-black text-[#00ff9d] tracking-tight">
                    {boostVal.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold uppercase">
                    BAR
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-1">
                  <span>PEAK: +1.45 BAR</span>
                  <span>•</span>
                  <span>MANIFOLD: {(boostVal * 14.5038).toFixed(1)} PSI</span>
                </div>
              </div>

              {/* Circular Mini Radial Progress */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#16202f"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#00ff9d"
                    strokeWidth="4.5"
                    strokeDasharray={2 * Math.PI * 26}
                    strokeDashoffset={2 * Math.PI * 26 * (1 - boostRatio)}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                <div className="absolute text-[11px] font-mono font-extrabold text-white">
                  {boostPct}%
                </div>
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* COLUMN 3 (3 cols): BATTERY & COMPONENT HEALTH STACK          */}
          {/* ============================================================ */}
          <div className="lg:col-span-3 flex flex-col gap-3">
            
            {/* CARD 1: BATTERY (Updated: Not Electrical & Fluid, Just BATTERY) */}
            <div className="cockpit-card rounded-2xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#172130] pb-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                  BATTERY
                </span>
                <Battery className="w-4 h-4 text-cyan-400" />
              </div>

              <div className="space-y-3 my-2 text-xs font-mono">
                {/* System Batt */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">SYSTEM BATT</span>
                    <span className="text-base font-bold text-white tracking-wide">
                      {battVoltage.toFixed(1)} V
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff9d] border border-emerald-500/40">
                    CHARGING
                  </span>
                </div>

                {/* Battery SoC */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">BATT SOC</span>
                    <span className="text-base font-bold text-white tracking-wide">
                      {battSoC}%
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff9d] border border-emerald-500/40">
                    OPTIMAL
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: COMPONENT HEALTH & CAN METRICS */}
            <div className="cockpit-card rounded-2xl p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-[#172130] pb-2">
                  <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase">
                    COMPONENT HEALTH
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                    activeFaults.length > 0
                      ? 'bg-red-500/20 text-rose-400 border-red-500/40 animate-pulse'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    {activeFaults.length > 0 ? `${activeFaults.length} FAULT(S)` : '3 ACTIVE'}
                  </span>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3 text-xs font-mono">
                  {/* Powertrain */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-semibold">POWERTRAIN</span>
                      <span className={`${powertrainHealth < 60 ? 'text-rose-400' : 'text-[#00ff9d]'} font-bold`}>
                        {powertrainHealth}%
                      </span>
                    </div>
                    <div className="w-full bg-[#151e2b] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          powertrainHealth < 60
                            ? 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
                            : 'bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]'
                        }`}
                        style={{ width: `${powertrainHealth}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      {powertrainHealth < 60 ? 'Critical Alert Active' : 'Normal Operation'}
                    </span>
                  </div>

                  {/* Turbo System */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-semibold">TURBO SYSTEM</span>
                      <span className="text-amber-400 font-bold">{turboHealth}%</span>
                    </div>
                    <div className="w-full bg-[#151e2b] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#f59e0b]"
                        style={{ width: `${turboHealth}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Service Req. 1,200 km</span>
                  </div>

                  {/* Aux Circuit / Hydraulics */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-300 font-semibold">
                        {vehicleType === 'HDV' ? 'HYDRAULIC CIRCUIT' : 'AUX CIRCUIT'}
                      </span>
                      <span className="text-rose-400 font-bold">{auxHealth}%</span>
                    </div>
                    <div className="w-full bg-[#151e2b] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_#f43f5e]"
                        style={{ width: `${auxHealth}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 block mt-0.5">Limp Mode Standby</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Scan Freq & DTC State */}
              <div className="flex items-center justify-between text-[10px] font-mono pt-3 border-t border-[#172130] mt-3">
                <span className="text-slate-500">SCAN FREQ: 50Hz</span>
                {activeFaults.length === 0 ? (
                  <span className="text-[#00ff9d] font-bold tracking-wider">NO FAULT CODES</span>
                ) : (
                  <span className="text-rose-400 font-bold tracking-wider animate-pulse">
                    {activeFaults.length} FAULTS ACTIVE
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* ============================================================== */}
        {/* BOTTOM CLUSTER STATUS STRIP                                    */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 mt-4 border-t border-[#1a2537] text-[11px] font-mono text-slate-400">
          {/* Driver Assists */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="font-semibold uppercase tracking-wider">LANE ASSIST ACTIVE</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Radio className="w-3 h-3 text-cyan-400" />
              <span>ACC: 110 KM/H</span>
            </div>
          </div>

          {/* TPMS Tire Pressures */}
          <div className="flex items-center gap-2 text-slate-400">
            <Disc className="w-3 h-3 text-slate-500" />
            <span className="text-[10px] text-slate-500 uppercase">TPMS:</span>
            <span className="text-slate-200">
              FL <strong className="text-emerald-400">2.4</strong> | FR <strong className="text-emerald-400">2.4</strong> | RL <strong className="text-emerald-400">2.3</strong> | RR <strong className="text-emerald-400">2.3</strong> BAR
            </span>
          </div>

          {/* CAN Bus Hardware Active Status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d] animate-pulse" />
            <span className="text-slate-300 font-bold tracking-wider uppercase text-[10px]">
              {vehicleType === 'HDV' ? 'CHASSIS: J1939-CANBUS (250 KBPS)' : 'CHASSIS: W213-CANBUS (1000 KBPS)'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
