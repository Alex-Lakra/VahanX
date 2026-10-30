import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useConnectionStore } from '../stores/connectionStore';
import { useHealthStore } from '../stores/healthStore';
import { NetworkSimModal } from './NetworkSimModal';
import {
  Gauge,
  AlertTriangle,
  Sliders,
  Activity,
  Truck,
  RotateCw,
  Droplet,
  UserCheck,
  Wifi,
  Power,
  RefreshCw,
  Thermometer,
  Zap,
  ChevronDown,
  Car,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const {
    isConnected,
    isConnecting,
    vehicleType,
    setVehicleType,
    connect,
    disconnect,
  } = useConnectionStore();

  const healthScore = useHealthStore((s) => s.score);
  const statusBand = useHealthStore((s) => s.statusBand);

  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isSystemsMenuOpen, setIsSystemsMenuOpen] = useState(false);
  const [driveMode, setDriveMode] = useState<'SPORT' | 'SPORT+' | 'ECO' | 'WORK'>('SPORT');
  const [gear, setGear] = useState<'P' | 'R' | 'N' | 'D'>('D');
  const [timeStr, setTimeStr] = useState('10:42 AM');

  // Clock ticker
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

  const handleConnectionToggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const getScoreBadgeColor = () => {
    if (statusBand === 'GREEN') return 'bg-emerald-500/20 text-[#00ff9d] border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,157,0.3)]';
    if (statusBand === 'AMBER') return 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]';
    return 'bg-red-500/20 text-rose-400 border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse';
  };

  const isSystemsActive =
    location.pathname === '/tractor' ||
    location.pathname === '/pto' ||
    location.pathname === '/hydraulics' ||
    location.pathname === '/health';

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#070a0f]/95 backdrop-blur-md border-b border-[#182233]">
        {/* ========================================================== */}
        {/* TOP COCKPIT MASTHEAD BAR                                  */}
        {/* ========================================================== */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* LEFT: Logo + Drive Mode Pill + Gear Box (P R N D only) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Brand Logo */}
            <NavLink to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-display font-black text-black text-base tracking-wider shadow-[0_0_12px_rgba(0,255,157,0.4)]">
                VX
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-black text-sm tracking-[0.2em] text-white block leading-none">
                  VAHANX
                </span>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest block uppercase">
                  DIGITAL COCKPIT
                </span>
              </div>
            </NavLink>

            {/* Drive Mode Pill */}
            <button
              onClick={() => {
                const modes: ('SPORT' | 'SPORT+' | 'ECO' | 'WORK')[] = ['SPORT', 'SPORT+', 'ECO', 'WORK'];
                const next = modes[(modes.indexOf(driveMode) + 1) % modes.length];
                setDriveMode(next);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-[#00ff9d] hover:bg-emerald-500/20 text-[10px] font-mono font-bold tracking-widest transition-all"
              title="Click to cycle drive mode"
            >
              <Zap className="w-3 h-3 text-[#00ff9d]" />
              <span>{driveMode}</span>
            </button>

            {/* Gear Selector Box (P R N D only) */}
            <div className="hidden md:flex items-center gap-0.5 bg-[#0a0f18] px-2 py-0.5 rounded-lg border border-[#1a2538] text-[10px] font-mono font-bold tracking-widest">
              {(['P', 'R', 'N', 'D'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGear(g)}
                  className={`px-2 py-0.5 rounded transition-all ${
                    gear === g
                      ? 'bg-[#00ff9d] text-black font-black shadow-[0_0_8px_#00ff9d]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* CENTER: Main Cockpit Tabs (CLUSTER | DIAGNOSTICS | SYSTEMS) */}
          <nav className="hidden lg:flex items-center gap-1.5 font-mono text-xs">
            {/* 1. CLUSTER */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3.5 py-1.5 rounded-full font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00ff9d] text-black shadow-[0_0_14px_rgba(0,255,157,0.5)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>CLUSTER</span>
            </NavLink>

            {/* 2. DIAGNOSTICS */}
            <NavLink
              to="/faults"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-full font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#152233] text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,212,255,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DIAGNOSTICS</span>
            </NavLink>

            {/* 3. SYSTEMS Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsSystemsMenuOpen(!isSystemsMenuOpen)}
                className={`px-3 py-1.5 rounded-full font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 ${
                  isSystemsActive
                    ? 'bg-[#152233] text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>SYSTEMS</span>
                <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
              </button>

              {/* Dropdown Menu */}
              {isSystemsMenuOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 rounded-2xl bg-[#0c121d] border border-[#1f2d42] shadow-2xl py-2 z-50 text-xs font-mono"
                  onMouseLeave={() => setIsSystemsMenuOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                    Subsystems & Calibrations
                  </div>
                  <NavLink
                    to="/health"
                    onClick={() => setIsSystemsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#162335] hover:text-white"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Health Scoreboard</span>
                  </NavLink>
                  {vehicleType === 'HDV' && (
                    <>
                      <NavLink
                        to="/tractor"
                        onClick={() => setIsSystemsMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#162335] hover:text-white"
                      >
                        <Truck className="w-4 h-4 text-amber-400" />
                        <span>Tractor Telematics</span>
                      </NavLink>
                      <NavLink
                        to="/pto"
                        onClick={() => setIsSystemsMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#162335] hover:text-white"
                      >
                        <RotateCw className="w-4 h-4 text-cyan-400" />
                        <span>PTO & ISOBUS Implement</span>
                      </NavLink>
                      <NavLink
                        to="/hydraulics"
                        onClick={() => setIsSystemsMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#162335] hover:text-white"
                      >
                        <Droplet className="w-4 h-4 text-blue-400" />
                        <span>Hydraulics (9-Part)</span>
                      </NavLink>
                    </>
                  )}
                  <NavLink
                    to="/tuning"
                    onClick={() => setIsSystemsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:bg-[#162335] hover:text-white"
                  >
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>ECU Tuning & Limp Mode</span>
                  </NavLink>
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: Vehicle Type Pill + Health Pill + Outside Temp + Clock + Connect + Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Vehicle Mode Toggle (HDV vs LMV) */}
            <div className="flex items-center bg-[#090e17] p-0.5 rounded-lg border border-[#182333] text-[10px] font-mono">
              <button
                onClick={() => setVehicleType('HDV')}
                className={`px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                  vehicleType === 'HDV'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Heavy-Duty Vehicle (SAE J1939 Tractor)"
              >
                <Truck className="w-3 h-3" />
                <span className="hidden sm:inline">HDV</span>
              </button>
              <button
                onClick={() => setVehicleType('LMV')}
                className={`px-2 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                  vehicleType === 'LMV'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Light Motor Vehicle (OBD-II Car)"
              >
                <Car className="w-3 h-3" />
                <span className="hidden sm:inline">LMV</span>
              </button>
            </div>

            {/* Master Health Score Pill */}
            <NavLink
              to="/health"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[11px] font-bold transition-all ${getScoreBadgeColor()}`}
              title="Vehicle Health Score"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{healthScore}</span>
              <span className="text-[9px] uppercase tracking-wider">{statusBand}</span>
            </NavLink>

            {/* Outside Temp & Clock */}
            <div className="hidden sm:flex items-center gap-2 text-slate-300 font-mono text-xs">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-slate-400" />
                <span>22°C</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>{timeStr}</span>
              </div>
            </div>

            {/* LAN WebSocket Simulator Trigger */}
            <button
              onClick={() => setIsSimModalOpen(true)}
              className="p-1.5 rounded-xl border border-[#1f2d42] bg-[#0c121d] text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
              title="Configure LAN WebSocket CAN Bus Simulator"
            >
              <Wifi className="w-4 h-4" />
            </button>

            {/* Hardware Connect / Sniff Button */}
            <button
              onClick={handleConnectionToggle}
              disabled={isConnecting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md ${
                isConnected
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : isConnecting
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-[#121a28] hover:bg-[#182436] text-slate-200 border border-[#202e42]'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {isConnected ? 'ONLINE' : isConnecting ? 'CONNECTING' : 'CONNECT'}
              </span>
            </button>

            {/* User Profile Avatar Pill */}
            <NavLink
              to="/driver-profile"
              className="w-8 h-8 rounded-full bg-[#00ff9d] hover:bg-emerald-400 text-black flex items-center justify-center font-bold shadow-[0_0_10px_rgba(0,255,157,0.5)] transition-transform hover:scale-105 shrink-0"
              title="Driver Profile & Offline Cloud Sync"
            >
              <UserCheck className="w-4 h-4" />
            </NavLink>
          </div>

        </div>

        {/* ========================================================== */}
        {/* MOBILE SECONDARY NAVIGATION STRIP                          */}
        {/* ========================================================== */}
        <div className="lg:hidden border-t border-[#152030] overflow-x-auto scrollbar-none bg-[#070b12]">
          <div className="px-3 py-1.5 flex items-center gap-1.5 min-w-max text-xs font-mono">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                  isActive
                    ? 'bg-[#00ff9d] text-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              Cluster
            </NavLink>

            <NavLink
              to="/faults"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                  isActive
                    ? 'bg-[#152233] text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              Diagnostics
            </NavLink>

            <NavLink
              to="/health"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                  isActive
                    ? 'bg-[#152233] text-emerald-300 border border-emerald-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              Health
            </NavLink>

            {vehicleType === 'HDV' && (
              <>
                <NavLink
                  to="/tractor"
                  className={({ isActive }) =>
                    `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  Tractor HDV
                </NavLink>

                <NavLink
                  to="/pto"
                  className={({ isActive }) =>
                    `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  PTO & Implement
                </NavLink>

                <NavLink
                  to="/hydraulics"
                  className={({ isActive }) =>
                    `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                        : 'text-slate-400 hover:text-slate-200'
                    }`
                  }
                >
                  Hydraulics
                </NavLink>
              </>
            )}

            <NavLink
              to="/tuning"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                  isActive
                    ? 'bg-[#152233] text-amber-300 border border-amber-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              Tuning
            </NavLink>

            <NavLink
              to="/driver-profile"
              className={({ isActive }) =>
                `px-3 py-1 rounded-lg font-bold tracking-wider uppercase ${
                  isActive
                    ? 'bg-[#152233] text-cyan-300 border border-cyan-500/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              Profile
            </NavLink>
          </div>
        </div>
      </header>

      {/* Network Simulator Settings Modal */}
      <NetworkSimModal isOpen={isSimModalOpen} onClose={() => setIsSimModalOpen(false)} />
    </>
  );
};
