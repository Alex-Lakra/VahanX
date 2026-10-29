import React, { useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { TelemetryDashboard } from './pages/TelemetryDashboard';
import { FaultExplorer } from './pages/FaultExplorer';
import { TuningPage } from './pages/TuningPage';
import { HealthScoreboard } from './pages/HealthScoreboard';
import { HDVTelemetryPage } from './pages/HDVTelemetryPage';
import { PTODrawbarPage } from './pages/PTODrawbarPage';
import { HydraulicsPage } from './pages/HydraulicsPage';
import { DriverProfilePage } from './pages/DriverProfilePage';
import { RequireHeavyDuty } from './components/RequireHeavyDuty';

import { useConnectionStore } from './stores/connectionStore';
import { useTelemetryStore } from './stores/telemetryStore';
import { useDTCStore } from './stores/dtcStore';
import { WorkerOutboundMsg } from './types/protocols';
import { CloudSyncEngine } from './services/CloudSyncEngine';

export const App: React.FC = () => {
  const workerRef = useRef<Worker | null>(null);

  const adapterInstance = useConnectionStore((s) => s.adapterInstance);
  const vehicleType = useConnectionStore((s) => s.vehicleType);
  const setVehicleType = useConnectionStore((s) => s.setVehicleType);
  const setHandshakeStep = useConnectionStore((s) => s.setHandshakeStep);
  const pushRawFrame = useConnectionStore((s) => s.pushRawFrame);

  const updateCoreTelemetry = useTelemetryStore((s) => s.updateCoreTelemetry);
  const updateHDVTelemetry = useTelemetryStore((s) => s.updateHDVTelemetry);
  const updateHydraulics = useTelemetryStore((s) => s.updateHydraulics);
  const addFaults = useDTCStore((s) => s.addFaults);

  // 1. Initialize Web Worker for parsing
  useEffect(() => {
    CloudSyncEngine.initialize();

    const worker = new Worker(new URL('./workers/ecuWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerOutboundMsg>) => {
      const msg = event.data;
      switch (msg.type) {
        case 'TELEMETRY_UPDATE':
          updateCoreTelemetry(msg.payload, useConnectionStore.getState().vehicleType);
          break;
        case 'HDV_UPDATE':
          updateHDVTelemetry(msg.payload);
          break;
        case 'HYDRAULIC_UPDATE':
          updateHydraulics(msg.payload);
          break;
        case 'DTC_DETECTED':
          addFaults(msg.payload);
          break;
        case 'VEHICLE_TYPE_RESOLVED':
          setVehicleType(msg.payload);
          setHandshakeStep(`Auto-handshake complete: Detected ${msg.payload} vehicle bus.`);
          break;
        case 'RAW_SNIFF':
          pushRawFrame(msg.payload);
          break;
        default:
          break;
      }
    };

    return () => {
      worker.terminate();
    };
  }, [updateCoreTelemetry, updateHDVTelemetry, updateHydraulics, addFaults, setVehicleType, setHandshakeStep, pushRawFrame]);

  // 2. Wire adapter data stream into worker
  useEffect(() => {
    if (adapterInstance) {
      adapterInstance.onData((raw) => {
        workerRef.current?.postMessage({
          type: 'RAW_FRAME',
          payload: raw,
        });
      });
    }
  }, [adapterInstance]);

  return (
    <Router>
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans select-none">
        <Navbar />

        <main className="flex-1 pb-10">
          <Routes>
            <Route path="/" element={<TelemetryDashboard />} />
            <Route path="/faults" element={<FaultExplorer />} />
            <Route path="/tuning" element={<TuningPage />} />
            <Route path="/health" element={<HealthScoreboard />} />

            {/* Heavy-Duty / Tractor exclusive routes */}
            <Route
              path="/tractor"
              element={
                <RequireHeavyDuty>
                  <HDVTelemetryPage />
                </RequireHeavyDuty>
              }
            />
            <Route
              path="/pto"
              element={
                <RequireHeavyDuty>
                  <PTODrawbarPage />
                </RequireHeavyDuty>
              }
            />
            <Route
              path="/hydraulics"
              element={
                <RequireHeavyDuty>
                  <HydraulicsPage />
                </RequireHeavyDuty>
              }
            />

            <Route path="/driver-profile" element={<DriverProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

