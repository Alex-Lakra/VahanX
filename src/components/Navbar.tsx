import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    vehicleType,
    setVehicleType,
    adapterType,
    connect,
    disconnect,
  } = useConnectionStore();

  const healthScore = useHealthStore((s) => s.score);
  const statusBand = useHealthStore((s) => s.statusBand);

  const [isSimModalOpen, setIsSimModalOpen] = useState(false);

  const handleConnectionToggle = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      await connect();
    }
  };

  const getScoreBadgeColor = () => {
    if (statusBand === 'GREEN') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (statusBand === 'AMBER') return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
    return 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse';
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#080b12]/95 backdrop-blur border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center font-mono font-black text-white text-lg tracking-wider glow-accent">
              VX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-base tracking-widest text-white">
                  VAHANX
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  DUAL-PROTOCOL
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                OBD-II CAN / SAE J1939 ISOBUS
              </span>
            </div>
          </div>

          {/* Vehicle Class Switcher / Status Pill */}
          <div className="hidden md:flex items-center gap-2 bg-[#0d121e] border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setVehicleType('HDV')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                vehicleType === 'HDV'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              HDV (Tractor / 9-Pin)
            </button>
            <button
              onClick={() => setVehicleType('LMV')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 ${
                vehicleType === 'LMV'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              LMV (Passenger Car)
            </button>
          </div>

          {/* Health Score & Connection Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Master Health Pill */}
            <NavLink
              to="/health"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all ${getScoreBadgeColor()}`}
              title="Click to view weighted vehicle health scorecard"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{healthScore}</span>
              <span className="text-[9px] uppercase tracking-wider">{statusBand}</span>
            </NavLink>

            {/* LAN WebSocket Simulator Trigger */}
            <button
              onClick={() => setIsSimModalOpen(true)}
              className="p-1.5 rounded-lg border border-slate-700 bg-slate-900 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500 transition-colors"
              title="Configure LAN WebSocket Simulator (Accept frames from another laptop)"
            >
              <Wifi className="w-4 h-4" />
            </button>

            {/* Hardware Connect Button */}
            <button
              onClick={handleConnectionToggle}
              disabled={isConnecting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-md ${
                isConnected
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : isConnecting
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isConnecting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Power className="w-3.5 h-3.5" />
              )}
              <span>{isConnected ? 'ONLINE' : isConnecting ? 'SNIFFING...' : 'CONNECT'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-t border-slate-800/80 overflow-x-auto scrollbar-none bg-[#090d16]/80">
          <nav className="max-w-7xl mx-auto px-4 flex items-center gap-1 text-xs font-mono py-1.5 min-w-max">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>Page 1: Telemetry (3x3)</span>
            </NavLink>

            <NavLink
              to="/faults"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Page 2: DTC & Maps</span>
            </NavLink>

            <NavLink
              to="/tuning"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Page 3: Tuning & Limp</span>
            </NavLink>

            <NavLink
              to="/health"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Page 4: Scoreboard</span>
            </NavLink>

            {/* Heavy-Duty / Tractor exclusive routes (Requirements 7-10) */}
            {vehicleType === 'HDV' && (
              <>
                <NavLink
                  to="/tractor"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-amber-400/70 hover:text-amber-300'
                    }`
                  }
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Page 5: Tractor HDV</span>
                </NavLink>

                <NavLink
                  to="/pto"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-amber-400/70 hover:text-amber-300'
                    }`
                  }
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Page 6: PTO & Implement</span>
                </NavLink>

                <NavLink
                  to="/hydraulics"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-amber-400/70 hover:text-amber-300'
                    }`
                  }
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Page 7: Hydraulics (9-Part)</span>
                </NavLink>
              </>
            )}

            <NavLink
              to="/driver-profile"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Page 8: Driver Profile & Sync</span>
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Network Simulator Settings Modal */}
      <NetworkSimModal isOpen={isSimModalOpen} onClose={() => setIsSimModalOpen(false)} />
    </>
  );
};

