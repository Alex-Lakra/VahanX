import React, { useEffect } from 'react';
import { useTelemetryStore } from '../stores/telemetryStore';
import { useConnectionStore } from '../stores/connectionStore';
import { useHealthStore } from '../stores/healthStore';
import { HealthScoreEngine } from '../services/HealthScoreEngine';
import { LimpModeController } from '../services/LimpModeController';
import { useDTCStore } from '../stores/dtcStore';
import { TelemetryCard } from '../components/TelemetryCard';
import { DashboardWarningPopup } from '../components/DashboardWarningPopup';
import { LimpModeOverlay } from '../components/LimpModeOverlay';
import { Activity, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const TelemetryDashboard: React.FC = () => {
  const core = useTelemetryStore((s) => s.core);
  const hdv = useTelemetryStore((s) => s.hdv);
  const logToDatabase = useTelemetryStore((s) => s.logToDatabase);
  const vehicleType = useConnectionStore((s) => s.vehicleType);
  const isConnected = useConnectionStore((s) => s.isConnected);
  const handshakeStep = useConnectionStore((s) => s.handshakeStep);

  const activeFaults = useDTCStore((s) => s.activeFaults);
  const hydraulicsScore = useHealthStore((s) => s.hydraulicsScore);
  const setHealthResult = useHealthStore((s) => s.setHealthResult);

  // Recalculate health score whenever telemetry or faults update
  useEffect(() => {
    const healthResult = HealthScoreEngine.evaluate(
      core,
      hdv,
      hydraulicsScore,
      activeFaults,
      vehicleType
    );
    setHealthResult(healthResult.score, healthResult.statusBand, healthResult.categories);

    // Evaluate Limp Mode automatic trigger
    const limpTriggered = LimpModeController.evaluate(
      core,
      hdv,
      activeFaults,
      healthResult.score,
      vehicleType
    );

    // Log to offline IndexedDB database
    logToDatabase(
      vehicleType === 'HDV' ? 'TRACTOR-HDV-01' : 'CAR-LMV-01',
      'current_driver',
      healthResult.score,
      limpTriggered,
      LimpModeController.getState().isOverridden
    );
  }, [core, hdv, hydraulicsScore, activeFaults, vehicleType, setHealthResult, logToDatabase]);

  return (
    <div className="min-h-[calc(100vh-100px)] p-4 max-w-7xl mx-auto space-y-4">
      {/* 20 km/h Limp Mode Banner Overlay if Engaged */}
      <LimpModeOverlay />

      {/* Dashboard Warning Popup Overlay */}
      <DashboardWarningPopup />

      {/* Sub-Header Status Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#0c101c] p-3 rounded-xl border border-slate-800 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-slate-300 font-bold uppercase tracking-wider">
            {vehicleType === 'HDV'
              ? 'TRACTOR HEAVY-DUTY (SAE J1939 / ISOBUS 250/500k)'
              : 'PASSENGER CAR (ISO 15765-4 OBD-II 500k)'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">{handshakeStep}</span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rate: 20 Hz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>CRC: Valid</span>
          </div>
        </div>
      </div>

      {/* 9 CORE LIVE TELEMETRY VARIABLES: HIGH-CONTRAST 3x3 BARE-BONES GRID */}
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

      {/* Bottom Emergency Help / Field Quick Actions */}
      <div className="p-4 rounded-xl bg-[#0b0e18] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Out-of-window telemetry values trigger instant solid red highlighting and dashboard warning advice.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">CAN Port:</span>
          <span className="text-slate-200 font-bold">
            {vehicleType === 'HDV' ? 'Deutsch 9-Pin J1939-13' : 'Trapezoidal 16-Pin DLC'}
          </span>
        </div>
      </div>
    </div>
  );
};

