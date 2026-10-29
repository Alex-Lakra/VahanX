import { create } from 'zustand';
import { CoreTelemetryState, HDVTelemetryState, HydraulicTelemetryState, DashboardAlert, VehicleType } from '../types/telemetry';
import { evaluateThreshold } from '../config/VehicleThresholds';
import { db } from '../db/localDatabase';

interface TelemetryStore {
  core: CoreTelemetryState;
  hdv: HDVTelemetryState;
  hydraulics: HydraulicTelemetryState;
  activeAlert: DashboardAlert | null;
  alertQueue: DashboardAlert[];

  updateCoreTelemetry: (updates: Partial<Record<keyof CoreTelemetryState, number>>, vehicleType: VehicleType) => void;
  updateHDVTelemetry: (updates: Partial<HDVTelemetryState>) => void;
  updateHydraulics: (updates: Partial<HydraulicTelemetryState>) => void;
  dismissAlert: () => void;
  logToDatabase: (vin: string, driverId: string, masterScore: number, limpActive: boolean, limpOverridden: boolean) => Promise<void>;
}

const initialCore: CoreTelemetryState = {
  speed: { value: 34, unit: 'km/h', status: 'normal' },
  engineTemp: { value: 88, unit: '°C', status: 'normal' },
  oilTemp: { value: 94, unit: '°C', status: 'normal' },
  rpm: { value: 1650, unit: 'RPM', status: 'normal' },
  boostGauge: { value: 1.4, unit: 'bar', status: 'normal' },
  coolantTemp: { value: 90, unit: '°C', status: 'normal' },
  totalDistance: { value: 12450, unit: 'km', status: 'normal' },
  batterySoC: { value: 92, unit: '%', status: 'normal' },
  systemVoltage: { value: 28.2, unit: 'V', status: 'normal' },
  timestamp: Date.now(),
};

const initialHDV: HDVTelemetryState = {
  airBrakeCircuit1: { value: 8.2, unit: 'bar', status: 'normal' },
  airBrakeCircuit2: { value: 8.4, unit: 'bar', status: 'normal' },
  axleLoadFront: { value: 3.8, unit: 't', status: 'normal' },
  axleLoadRear: { value: 7.2, unit: 't', status: 'normal' },
  suspensionHeight: { value: 0, unit: 'mm', status: 'normal' },
  amtClutchSlip: { value: 1.2, unit: '%', status: 'normal' },
  amtShaftSpeedDiff: { value: 24, unit: 'RPM', status: 'normal' },
  retarderStage: 0,
  retarderTorquePct: { value: 0, unit: '%', status: 'normal' },
  ptoEngaged: true,
  ptoSpeed: { value: 540, unit: 'RPM', status: 'normal' },
  ptoTargetSpeed: 540,
  ptoClutchSlip: { value: 1.8, unit: '%', status: 'normal' },
  ptoTorque: { value: 450, unit: 'Nm', status: 'normal' },
  ptoShieldInterlock: true,
  noxPreSCR: { value: 420, unit: 'ppm', status: 'normal' },
  noxPostSCR: { value: 35, unit: 'ppm', status: 'normal' },
  dpfSootLoad: { value: 38, unit: '%', status: 'normal' },
  adBlueLevel: { value: 78, unit: '%', status: 'normal' },
  smokeOpacity: { value: 4.2, unit: '%', status: 'normal' },
  engineHours: { value: 420.5, unit: 'hrs', status: 'normal' },
  drawbarDraftForce: { value: 18.5, unit: 'kN', status: 'normal' },
  tongueWeight: { value: 850, unit: 'kg', status: 'normal' },
  hitchLockEngaged: true,
  trailerLightingContinuity: true,
  wheelSlipPct: { value: 6.5, unit: '%', status: 'normal' },
  isobusImplementName: 'Väderstad Carrier 500 Disc Cultivator',
  isobusWorkingWidthMeters: 5.0,
  isobusFoldLockEngaged: true,
  isobusApplicationRate: { value: 0, unit: 'kg/ha', status: 'normal' },
};

const initialHydraulics: HydraulicTelemetryState = {
  reservoirLevel: { value: 84, unit: '%', status: 'normal' },
  reservoirTemp: { value: 62, unit: '°C', status: 'normal' },
  reservoirMoistureAeration: 'LOW',
  pumpFlowRate: { value: 110, unit: 'L/min', status: 'normal' },
  pumpDischargePressure: { value: 185, unit: 'bar', status: 'normal' },
  pumpDriveTorque: { value: 98, unit: 'Nm', status: 'normal' },
  pumpVolumetricEfficiency: { value: 94, unit: '%', status: 'normal' },
  controlValveSCV1: { value: 65, unit: '%', status: 'normal' },
  controlValveSCV2: { value: 0, unit: '%', status: 'normal' },
  controlValveSolenoidCurrent: { value: 850, unit: 'mA', status: 'normal' },
  filterPressureDiff: { value: 1.2, unit: 'bar', status: 'normal' },
  filterBypassActive: false,
  reliefValveCrackingPressure: { value: 215, unit: 'bar', status: 'normal' },
  reliefValveBlowByDetected: false,
  hoseLeakRiskLevel: 'NOMINAL',
  cylinderDriftRatePctMin: { value: 0.4, unit: '%/min', status: 'normal' },
  pistonRodStrainMicrostrain: { value: 380, unit: 'µε', status: 'normal' },
  threePointHitchPosition: { value: 45, unit: '%', status: 'normal' },
  threePointHitchPayloadKg: { value: 1450, unit: 'kg', status: 'normal' },
};

let lastDbLogTime = 0;

export const useTelemetryStore = create<TelemetryStore>((set, get) => ({
  core: initialCore,
  hdv: initialHDV,
  hydraulics: initialHydraulics,
  activeAlert: null,
  alertQueue: [],

  updateCoreTelemetry: (updates, vehicleType) => {
    const { core, activeAlert, alertQueue } = get();
    const newCore = { ...core, timestamp: Date.now() };
    let newAlert: DashboardAlert | null = activeAlert;
    const newQueue = [...alertQueue];

    for (const [key, rawVal] of Object.entries(updates)) {
      if (rawVal === undefined || !(key in newCore)) continue;
      const k = key as keyof CoreTelemetryState;
      if (k === 'timestamp') continue;

      const evalResult = evaluateThreshold(k, rawVal, vehicleType);
      newCore[k] = {
        ...newCore[k],
        value: rawVal,
        status: evalResult.status,
      };

      if (evalResult.alert && evalResult.status !== 'normal') {
        const alertObj: DashboardAlert = {
          id: `${k}_${Date.now()}`,
          variable: k,
          title: evalResult.alert.title,
          message: evalResult.alert.message,
          drivingAdvice: evalResult.alert.advice,
          level: evalResult.status,
          timestamp: Date.now(),
        };

        if (!newAlert || (evalResult.status === 'critical' && newAlert.level !== 'critical')) {
          newAlert = alertObj;
        } else if (!newQueue.some((q) => q.variable === k)) {
          newQueue.push(alertObj);
        }
      }
    }

    set({ core: newCore, activeAlert: newAlert, alertQueue: newQueue });
  },

  updateHDVTelemetry: (updates) => {
    const { hdv } = get();
    set({ hdv: { ...hdv, ...updates } });
  },

  updateHydraulics: (updates) => {
    const { hydraulics } = get();
    set({ hydraulics: { ...hydraulics, ...updates } });
  },

  dismissAlert: () => {
    const { alertQueue } = get();
    if (alertQueue.length > 0) {
      const [nextAlert, ...rest] = alertQueue;
      set({ activeAlert: nextAlert, alertQueue: rest });
    } else {
      set({ activeAlert: null });
    }
  },

  logToDatabase: async (vin, driverId, masterScore, limpActive, limpOverridden) => {
    const now = Date.now();
    // Throttle to log every 5 seconds
    if (now - lastDbLogTime < 5000) return;
    lastDbLogTime = now;

    const { core } = get();
    try {
      await db.vehicleHealthLogs.add({
        vin,
        driverId,
        recordedAt: new Date().toISOString(),
        engineTempC: core.engineTemp.value,
        oilTempC: core.oilTemp.value,
        coolantTempC: core.coolantTemp.value,
        rpm: core.rpm.value,
        boostPressureBar: core.boostGauge.value,
        batteryVoltageV: core.systemVoltage.value,
        batterySoCPct: core.batterySoC.value,
        activeDtcCount: 0,
        activeDtcList: [],
        masterHealthScore: masterScore,
        isLimpModeActive: limpActive,
        limpModeOverridden: limpOverridden,
        syncStatus: 'pending',
      });
    } catch (e) {
      console.warn('[telemetryStore] IndexedDB logging deferred', e);
    }
  },
}));

