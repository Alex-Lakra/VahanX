import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useHealthStore } from '../stores/healthStore';
import { LimpModeController } from '../services/LimpModeController';
import { CockpitCluster } from '../components/CockpitCluster';
import { TelemetryCard } from '../components/TelemetryCard';
import { DashboardWarningPopup } from '../components/DashboardWarningPopup';
import { LimpModeOverlay } from '../components/LimpModeOverlay';
import { AlertCircle, LayoutGrid, Gauge } from 'lucide-react';

interface TelemetryDashboardProps {
  initialView?: 'cluster' | 'grid';
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ initialView = 'cluster' }) => {
  const [activeView, setActiveView] = useState<'cluster' | 'grid'>(initialView);

  const core = useTelemetryStore((s) => s.core);
  const logToDatabase = useTelemetryStore((s) => s.logToDatabase);
  const vehicleType = useConnectionStore((s) => s.vehicleType);
  const handshakeStep = useConnectionStore((s) => s.handshakeStep);
  const healthScore = useHealthStore((s) => s.score);

  // Periodic offline IndexedDB database telemetry logging
  useEffect(() => {
    logToDatabase(
      vehicleType === 'HDV' ? 'TRACTOR-HDV-01' : 'CAR-LMV-01',
      'current_driver',
      healthScore,
      LimpModeController.getState().isActive,
      LimpModeController.getState().isOverridden
    );
  }, [core, vehicleType, healthScore, logToDatabase]);

  return (
    <div className="min-h-[calc(100vh-80px)] p-2 sm:p-4 max-w-7xl mx-auto space-y-4">
      {/* 20 km/h Limp Mode Banner Overlay if Engaged */}
      <LimpModeOverlay />

      {/* Dashboard Warning Popup Overlay */}
      <DashboardWarningPopup />

      {/* Sub-Header Bar: View Selector & Protocol Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#0b1019] px-3.5 py-2.5 rounded-2xl border border-[#1b2537] text-xs font-mono">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#00ff9d] shadow-[0_0_8px_#00ff9d] animate-pulse" />
          <span className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
            {vehicleType === 'HDV'
              ? 'TRACTOR HEAVY-DUTY (SAE J1939 / ISOBUS 250k)'
              : 'PASSENGER VEHICLE (ISO 15765-4 OBD-II 500k)'}
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 text-[11px] truncate max-w-xs">{handshakeStep}</span>
        </div>

        {/* View Switcher: Cluster vs 3x3 Grid */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-1 bg-[#070b12] p-1 rounded-xl border border-[#182333]">
            <button
              onClick={() => setActiveView('cluster')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-all ${
                activeView === 'cluster'
                  ? 'bg-gradient-to-r from-emerald-500 to-[#00ff9d] text-black font-black shadow-[0_0_12px_rgba(0,255,157,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" />
              <span>CLUSTER</span>
            </button>
            <button
              onClick={() => setActiveView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold tracking-wider transition-all ${
                activeView === 'grid'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black shadow-[0_0_12px_rgba(0,212,255,0.5)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>3x3 TELEMETRY</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Display View: Reference Cockpit Cluster or 3x3 Grid */}
      {activeView === 'cluster' ? (
        <CockpitCluster onSwitchView={() => setActiveView('grid')} />
      ) : (
        <div className="space-y-4">
          {/* 9 CORE LIVE TELEMETRY VARIABLES: HIGH-CONTRAST 3x3 GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* 1. Vehicle Speed */}
            <TelemetryCard
              displayNumber={1}
              label="Vehicle Speed"
              variableKey="speed"
              data={core.speed}
            />

            {/* 2. Engine Block Temp */}
            <TelemetryCard
              displayNumber={2}
              label="Engine Block Temp"
              variableKey="engineTemp"
              data={core.engineTemp}
            />

            {/* 3. Oil Temp */}
            <TelemetryCard
              displayNumber={3}
              label="Engine Oil Temp"
              variableKey="oilTemp"
              data={core.oilTemp}
            />

            {/* 4. Engine RPM */}
            <TelemetryCard
              displayNumber={4}
              label="Engine RPM"
              variableKey="rpm"
              data={core.rpm}
            />

            {/* 5. Boost Gauge */}
            <TelemetryCard
              displayNumber={5}
              label="Boost Pressure"
              variableKey="boostGauge"
              data={core.boostGauge}
            />

            {/* 6. Coolant Temp */}
            <TelemetryCard
              displayNumber={6}
              label="Coolant Temp"
              variableKey="coolantTemp"
              data={core.coolantTemp}
            />

            {/* 7. Total Distance / Engine Hours */}
            <TelemetryCard
              displayNumber={7}
              label={vehicleType === 'HDV' ? 'Operating Hours' : 'Total Distance'}
              variableKey="totalDistance"
              data={
                vehicleType === 'HDV'
                  ? { value: 420.5, unit: 'hrs', status: 'normal' }
                  : core.totalDistance
              }
            />

            {/* 8. Battery SoC */}
            <TelemetryCard
              displayNumber={8}
              label="Battery Level (SoC)"
              variableKey="batterySoC"
              data={core.batterySoC}
            />

            {/* 9. System Voltage */}
            <TelemetryCard
              displayNumber={9}
              label="System Voltage"
              variableKey="systemVoltage"
              data={core.systemVoltage}
            />
          </div>

          {/* Bottom Diagnostic Strip */}
          <div className="p-4 rounded-2xl bg-[#0b1019] border border-[#1b2537] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Automated threshold violation detection: out-of-tolerance signals trigger instantaneous Limp Mode and driver thermal warnings.
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>DLC Connector:</span>
              <strong className="text-slate-200">
                {vehicleType === 'HDV' ? 'Deutsch 9-Pin Type 1/2' : 'OBD-II 16-Pin SAE J1962'}
              </strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
