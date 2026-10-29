import { create } from 'zustand';
import { db } from '../db/localDatabase';

interface TuningStore {
  isUnlocked: boolean;
  waiverAgreed: boolean;
  unlockedAt: number | null;
  boostTargetBar: number;
  peakRpmGovernor: number;
  throttleSensitivityPct: number;
  ptoDroopPct: number;

  unlockWithWaiver: () => Promise<void>;
  lock: () => void;
  setBoostTarget: (bar: number) => void;
  setPeakRpmGovernor: (rpm: number) => void;
  setThrottleSensitivity: (pct: number) => void;
  setPtoDroop: (pct: number) => void;
}

export const useTuningStore = create<TuningStore>((set, get) => ({
  isUnlocked: false,
  waiverAgreed: false,
  unlockedAt: null,
  boostTargetBar: 1.4,
  peakRpmGovernor: 2400,
  throttleSensitivityPct: 100,
  ptoDroopPct: 10,

  unlockWithWaiver: async () => {
    const timestamp = Date.now();
    set({
      isUnlocked: true,
      waiverAgreed: true,
      unlockedAt: timestamp,
    });

    try {
      await db.driverBehaviourLogs.add({
        driverId: 'current_driver',
        vin: 'TRACTOR-HDV-01',
        sessionId: 'tuning_session',
        recordedAt: new Date(timestamp).toISOString(),
        speedKmh: 0,
        speedLimitKmh: 40,
        isOverspeeding: false,
        harshAccelerationEvent: false,
        harshBrakingEvent: false,
        harshCorneringEvent: false,
        continuousDrivingMinutes: 0,
        tuningPageAccessed: true,
        tuningChangesApplied: {
          waiverConfirmed: true,
          unlockedAt: timestamp,
        },
        syncStatus: 'pending',
      });
      console.log('[TuningStore] Warranty waiver unlock event logged to local database.');
    } catch (e) {
      console.warn('[TuningStore] Could not record waiver to local DB', e);
    }
  },

  lock: () => set({ isUnlocked: false }),

  setBoostTarget: (bar) => {
    set({ boostTargetBar: bar });
    logChange('boostTargetBar', bar, get());
  },

  setPeakRpmGovernor: (rpm) => {
    set({ peakRpmGovernor: rpm });
    logChange('peakRpmGovernor', rpm, get());
  },

  setThrottleSensitivity: (pct) => {
    set({ throttleSensitivityPct: pct });
    logChange('throttleSensitivityPct', pct, get());
  },

  setPtoDroop: (pct) => {
    set({ ptoDroopPct: pct });
    logChange('ptoDroopPct', pct, get());
  },
}));

async function logChange(key: string, val: number, state: TuningStore) {
  try {
    await db.driverBehaviourLogs.add({
      driverId: 'current_driver',
      vin: 'TRACTOR-HDV-01',
      sessionId: 'tuning_active',
      recordedAt: new Date().toISOString(),
      speedKmh: 0,
      speedLimitKmh: 40,
      isOverspeeding: false,
      harshAccelerationEvent: false,
      harshBrakingEvent: false,
      harshCorneringEvent: false,
      continuousDrivingMinutes: 0,
      tuningPageAccessed: true,
      tuningChangesApplied: {
        param: key,
        value: val,
        boostTarget: state.boostTargetBar,
        rpmGov: state.peakRpmGovernor,
      },
      syncStatus: 'pending',
    });
  } catch (e) {
    console.warn('[TuningStore] Parameter change logging skipped', e);
  }
}

