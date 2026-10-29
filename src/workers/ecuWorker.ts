import { WorkerInboundMsg, WorkerOutboundMsg } from '../types/protocols';
import { VehicleType } from '../types/telemetry';
import { parseOBDFrame } from './parsers/obdPIDParser';
import { parseJ1939RawString } from './parsers/j1939PGNParser';
import { lookupDTC } from '../data/dtcDictionary';

// State machine for 3-second bus auto-handshake
let activeProtocol: 'AUTO' | 'OBD2' | 'J1939' = 'AUTO';
let resolvedVehicleType: VehicleType | null = null;
let handshakeStartTime = Date.now();
let j1939FrameCount = 0;
let obdFrameCount = 0;

function postToMain(msg: WorkerOutboundMsg) {
  self.postMessage(msg);
}

function evaluateHandshake() {
  if (resolvedVehicleType !== null) return;

  const elapsedMs = Date.now() - handshakeStartTime;

  // 1. If we detected J1939 29-bit broadcast frames
  if (j1939FrameCount >= 2) {
    resolvedVehicleType = 'HDV';
    activeProtocol = 'J1939';
    postToMain({ type: 'VEHICLE_TYPE_RESOLVED', payload: 'HDV' });
    return;
  }

  // 2. If 1200ms elapsed with no J1939 traffic, and we got OBD-II responses
  if (elapsedMs > 1200 && obdFrameCount >= 1) {
    resolvedVehicleType = 'LMV';
    activeProtocol = 'OBD2';
    postToMain({ type: 'VEHICLE_TYPE_RESOLVED', payload: 'LMV' });
    return;
  }

  // 3. Fallback after 3000ms: default based on any traffic seen, or LMV default
  if (elapsedMs >= 3000) {
    const finalType: VehicleType = j1939FrameCount > obdFrameCount ? 'HDV' : 'LMV';
    resolvedVehicleType = finalType;
    activeProtocol = finalType === 'HDV' ? 'J1939' : 'OBD2';
    postToMain({ type: 'VEHICLE_TYPE_RESOLVED', payload: finalType });
  }
}

self.onmessage = (event: MessageEvent<WorkerInboundMsg>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'RESET': {
      activeProtocol = 'AUTO';
      resolvedVehicleType = null;
      handshakeStartTime = Date.now();
      j1939FrameCount = 0;
      obdFrameCount = 0;
      break;
    }

    case 'SET_PROTOCOL': {
      activeProtocol = msg.payload;
      resolvedVehicleType = msg.payload === 'J1939' ? 'HDV' : 'LMV';
      postToMain({ type: 'VEHICLE_TYPE_RESOLVED', payload: resolvedVehicleType });
      break;
    }

    case 'INJECT_SIM_DATA': {
      postToMain({ type: 'TELEMETRY_UPDATE', payload: msg.payload });
      break;
    }

    case 'RAW_FRAME': {
      const raw = msg.payload;
      postToMain({ type: 'RAW_SNIFF', payload: raw });

      // Handle J1939 frame format
      // Standard CAN format: e.g. "18FEF100 00 1A 2B..." or "0CF00400 ..."
      const isJ1939Shape = /^[0-1][0-9A-Fa-f]{7}\s/i.test(raw.trim());

      if (isJ1939Shape || activeProtocol === 'J1939') {
        const j1939Result = parseJ1939RawString(raw);
        if (j1939Result) {
          j1939FrameCount++;
          evaluateHandshake();

          if (Object.keys(j1939Result.telemetryUpdates || {}).length > 0) {
            postToMain({ type: 'TELEMETRY_UPDATE', payload: j1939Result.telemetryUpdates! });
          }
          if (Object.keys(j1939Result.hdvUpdates || {}).length > 0) {
            postToMain({ type: 'HDV_UPDATE', payload: j1939Result.hdvUpdates! });
          }
          if (Object.keys(j1939Result.hydraulicUpdates || {}).length > 0) {
            postToMain({ type: 'HYDRAULIC_UPDATE', payload: j1939Result.hydraulicUpdates! });
          }
          if (j1939Result.detectedFaults && j1939Result.detectedFaults.length > 0) {
            postToMain({ type: 'DTC_DETECTED', payload: j1939Result.detectedFaults });
          }
          return;
        }
      }

      // Handle OBD-II frame format (e.g. "41 0C 1A F8" or "43 01 05 24")
      const obdResult = parseOBDFrame(raw);
      if (obdResult.isPid00Supported || Object.keys(obdResult.telemetryUpdates || {}).length > 0) {
        obdFrameCount++;
        evaluateHandshake();

        if (Object.keys(obdResult.telemetryUpdates || {}).length > 0) {
          postToMain({ type: 'TELEMETRY_UPDATE', payload: obdResult.telemetryUpdates! });
        }

        if (obdResult.detectedDTCs && obdResult.detectedDTCs.length > 0) {
          const mappedDtcFaults = obdResult.detectedDTCs.map((code) => {
            const entry = lookupDTC(code);
            return {
              code: entry.code,
              source: 'OBD2' as const,
              title: entry.title,
              description: entry.description,
              severity: entry.severity,
              drivingAdvice: entry.drivingAdvice,
              potentialCauses: entry.potentialCauses,
              diagnosticSteps: entry.diagnosticSteps,
              timestamp: Date.now(),
            };
          });
          postToMain({ type: 'DTC_DETECTED', payload: mappedDtcFaults });
        }
      }

      evaluateHandshake();
      break;
    }

    default:
      break;
  }
};

