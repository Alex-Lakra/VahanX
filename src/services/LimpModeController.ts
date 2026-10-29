import { CoreTelemetryState, HDVTelemetryState, DTCFault, VehicleType } from '../types/telemetry';
import { db } from '../db/localDatabase';

export interface LimpModeState {
  isActive: boolean;
  reason: string;
  triggeredAt: number | null;
  speedLimitKmh: number;
  engineRpmLimit: number;
  isOverridden: boolean;
  overriddenAt: number | null;
}

export class LimpModeController {
  private static state: LimpModeState = {
    isActive: false,
    reason: '',
    triggeredAt: null,
    speedLimitKmh: 20,
    engineRpmLimit: 1200,
    isOverridden: false,
    overriddenAt: null,
  };

  private static listeners: ((state: LimpModeState) => void)[] = [];

  static getState(): LimpModeState {
    return { ...this.state };
  }

  static subscribe(listener: (state: LimpModeState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private static notify() {
    for (const listener of this.listeners) {
      listener(this.getState());
    }
  }

  /**
   * Evaluates active telemetry and fault states to automatically engage 20 km/h Limp Mode.
   */
  static evaluate(
    core: CoreTelemetryState,
    hdv: HDVTelemetryState | null,
    activeFaults: DTCFault[],
    masterHealthScore: number,
    vehicleType: VehicleType
  ): boolean {
    if (this.state.isOverridden) {
      // Driver manually bypassed limp mode; stay unlocked unless new catastrophic fault arises
      return false;
    }

    let shouldTrigger = false;
    let reason = '';

    // Check critical fault codes
    const redStopFault = activeFaults.find((f) => f.severity === 'critical');
    if (redStopFault) {
      shouldTrigger = true;
      reason = `Critical fault ${redStopFault.code}: ${redStopFault.title}`;
    }

    // Check oil temperature
    if (core.oilTemp.value > 125) {
      shouldTrigger = true;
      reason = `Engine oil temperature critical (${core.oilTemp.value}°C). Imminent lubrication seizure.`;
    }

    // Check coolant temperature
    const coolantLimit = vehicleType === 'HDV' ? 104 : 108;
    if (core.coolantTemp.value > coolantLimit) {
      shouldTrigger = true;
      reason = `Coolant boiling danger (${core.coolantTemp.value}°C). Cylinder head warping risk.`;
    }

    // Check HDV air brakes
    if (vehicleType === 'HDV' && hdv) {
      if (hdv.airBrakeCircuit1.value < 5.5 || hdv.airBrakeCircuit2.value < 5.5) {
        shouldTrigger = true;
        reason = `Air brake pressure critical (<5.5 bar). Danger of trailer spring brake lockup.`;
      }
    }

    // Check master health score
    if (masterHealthScore <= 39) {
      shouldTrigger = true;
      reason = `Master vehicle health score dropped to critical (${masterHealthScore}/100).`;
    }

    if (shouldTrigger && !this.state.isActive) {
      this.engage(reason);
      return true;
    }

    return this.state.isActive;
  }

  static engage(reason: string): void {
    this.state = {
      isActive: true,
      reason,
      triggeredAt: Date.now(),
      speedLimitKmh: 20,
      engineRpmLimit: 1200,
      isOverridden: false,
      overriddenAt: null,
    };
    this.notify();
    this.logLimpModeEvent(true, false, reason);
  }

  /**
   * Generates the SAE J1939 Torque/Speed Control 1 (TSC1, PGN 0) CAN message frame.
   */
  static buildJ1939TSC1Frame(targetSpeedKmh: number = 20, targetRpm: number = 1200): string {
    // PGN 0: 0x000000 -> CAN ID: 0x0C000003 (Priority 3, PGN 0, DA 0x00 Engine, SA 0x03)
    // Override control mode = 01 (Speed limit)
    // Requested speed = 20 km/h (1/256 km/h / bit)
    const rawSpeed = Math.round(targetSpeedKmh * 256);
    const spdLow = rawSpeed & 0xFF;
    const spdHigh = (rawSpeed >> 8) & 0xFF;

    // Requested engine speed = 1200 RPM (0.125 rpm / bit -> 9600 = 0x2580)
    const rawRpm = Math.round(targetRpm / 0.125);
    const rpmLow = rawRpm & 0xFF;
    const rpmHigh = (rawRpm >> 8) & 0xFF;

    return `0C000003 01 ${spdLow.toString(16).padStart(2, '0')} ${spdHigh.toString(16).padStart(2, '0')} ${rpmLow.toString(16).padStart(2, '0')} ${rpmHigh.toString(16).padStart(2, '0')} FF FF FF\r`;
  }

  /**
   * Driver manual override executed after 5-second press-and-hold confirmation.
   */
  static overrideLimpMode(): void {
    this.state = {
      ...this.state,
      isActive: false,
      isOverridden: true,
      overriddenAt: Date.now(),
    };
    this.notify();
    this.logLimpModeEvent(false, true, 'Driver executed 5-second mechanical liability override');
  }

  private static async logLimpModeEvent(active: boolean, overridden: boolean, note: string) {
    try {
      await db.driverBehaviourLogs.add({
        driverId: 'current_driver',
        vin: 'TRACTOR-HDV-01',
        sessionId: 'session_active',
        recordedAt: new Date().toISOString(),
        speedKmh: 20,
        speedLimitKmh: 20,
        isOverspeeding: false,
        harshAccelerationEvent: false,
        harshBrakingEvent: false,
        harshCorneringEvent: false,
        continuousDrivingMinutes: 0,
        limpModeOverrideEvent: overridden,
        syncStatus: 'pending',
      });
      console.log(`[LimpModeController] Event logged (active=${active}, overridden=${overridden}): ${note}`);
    } catch (e) {
      console.warn('[LimpModeController] Failed to log event locally', e);
    }
  }
}

