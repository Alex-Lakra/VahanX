import { VehicleType, StatusLevel } from '../types/telemetry';

export interface ThresholdRule {
  minWarning?: number;
  maxWarning?: number;
  minCritical?: number;
  maxCritical?: number;
  warningTitle: string;
  warningMessage: (val: number, type: VehicleType) => string;
  drivingAdvice: string;
}

export const TELEMETRY_THRESHOLDS: Record<string, ThresholdRule | ((type: VehicleType) => ThresholdRule)> = {
  speed: (type: VehicleType) => ({
    maxWarning: type === 'HDV' ? 35 : 100,
    maxCritical: type === 'HDV' ? 40 : 120,
    warningTitle: 'Vehicle Speed Exceeded',
    warningMessage: (val, vType) =>
      vType === 'HDV'
        ? `Tractor road speed ${val.toFixed(1)} km/h exceeds safe implement towing limits.`
        : `Vehicle speed ${val.toFixed(1)} km/h exceeds recommended highway threshold.`,
    drivingAdvice:
      'Ease off the throttle smoothly. Avoid abrupt panic braking, especially when towing loaded agricultural implements or trailers.',
  }),

  engineTemp: {
    minCritical: 60,
    maxWarning: 100,
    maxCritical: 108,
    warningTitle: 'Engine Block Temperature Critical',
    warningMessage: (val) =>
      val > 108
        ? `Engine temperature critical (${val.toFixed(1)} °C). Imminent head gasket & cylinder warp risk.`
        : `Engine cold-running (${val.toFixed(1)} °C) under load. Incomplete fuel combustion.`,
    drivingAdvice:
      'Reduce engine load immediately. Downshift if RPM is lugging, or disengage heavy PTO/auxiliary hydraulic loads and fast-idle to restore fan airflow.',
  },

  oilTemp: {
    maxWarning: 115,
    maxCritical: 125,
    warningTitle: 'Engine Oil Temperature Elevated',
    warningMessage: (val) =>
      `Engine oil temperature at ${val.toFixed(1)} °C. Oil film degradation & viscosity breakdown underway.`,
    drivingAdvice:
      'Avoid high-torque pulling. Cruise in moderate mid-range (1,500–1,800 RPM) to sustain positive oil pump pressure without heavy combustion heat.',
  },

  rpm: (type: VehicleType) => ({
    minCritical: type === 'HDV' ? 1100 : 700,
    maxWarning: type === 'HDV' ? 2200 : 5000,
    maxCritical: type === 'HDV' ? 2400 : 6000,
    warningTitle: 'Engine RPM Out Of Operating Band',
    warningMessage: (val, vType) =>
      val > (vType === 'HDV' ? 2400 : 6000)
        ? `Engine over-revving at ${Math.round(val)} RPM. Valve float risk.`
        : `Severe low-RPM torque lugging at ${Math.round(val)} RPM under high load.`,
    drivingAdvice:
      'Upshift to settle into the optimal torque plateau, or downshift if the engine is struggling under heavy field draft to prevent piston crown hammering.',
  }),

  boostGauge: (type: VehicleType) => ({
    maxWarning: type === 'HDV' ? 2.4 : 1.8,
    maxCritical: type === 'HDV' ? 2.8 : 2.2,
    warningTitle: 'Turbocharger Overboost Spike',
    warningMessage: (val, vType) =>
      `Manifold absolute boost reached ${val.toFixed(2)} bar (Limit: ${vType === 'HDV' ? 2.8 : 2.2} bar). Wastegate or VNT actuator drift.`,
    drivingAdvice:
      'Progressively back off the accelerator pedal. Avoid abrupt lift-off to prevent compressor surge and turbo bearing shock load.',
  }),

  coolantTemp: (type: VehicleType) => ({
    maxWarning: type === 'HDV' ? 98 : 100,
    maxCritical: type === 'HDV' ? 103 : 105,
    warningTitle: 'Coolant Temperature Critical',
    warningMessage: (val, vType) =>
      `Coolant boiling threshold approached (${val.toFixed(1)} °C, max safe: ${vType === 'HDV' ? 103 : 105} °C). Head gasket failure risk.`,
    drivingAdvice:
      'Turn off A/C, switch cabin heater to maximum blower speed to reject engine block heat, cut throttle demand by 50%, and bring vehicle to a safe idle.',
  }),

  totalDistance: (type: VehicleType) => ({
    maxWarning: type === 'HDV' ? 240 : 9500,
    maxCritical: type === 'HDV' ? 250 : 10000,
    warningTitle: 'Routine Maintenance Interval Due',
    warningMessage: (val, vType) =>
      vType === 'HDV'
        ? `Tractor operating hours (${val.toFixed(0)} hrs) exceeded scheduled 250 hr oil & hydraulic filter service.`
        : `Odometer reading indicates routine scheduled lube service interval is due.`,
    drivingAdvice:
      'Drive conservatively. Avoid heavy draft plowing or maximum payload hauling until engine oil, fuel separators, and hydraulic filters are serviced.',
  }),

  batterySoC: {
    minWarning: 40,
    minCritical: 25,
    warningTitle: 'Battery State of Charge Low',
    warningMessage: (val) =>
      `Battery reserve at ${val.toFixed(0)}%. Danger of ECU voltage dropouts and injector driver cut-off.`,
    drivingAdvice:
      'Switch off auxiliary work lights, secondary hydraulic oil coolers, and cabin blowers. Maintain >1,400 RPM to sustain alternator charge output.',
  },

  systemVoltage: (type: VehicleType) => ({
    minCritical: type === 'HDV' ? 23.5 : 11.8,
    minWarning: type === 'HDV' ? 24.2 : 12.2,
    maxWarning: type === 'HDV' ? 28.8 : 14.6,
    maxCritical: type === 'HDV' ? 29.5 : 15.0,
    warningTitle: 'Electrical System Voltage Anomaly',
    warningMessage: (val, vType) =>
      `Bus voltage at ${val.toFixed(1)}V (Nominal: ${vType === 'HDV' ? '24V' : '12V'}). Alternator diode or regulator malfunction.`,
    drivingAdvice:
      'Keep engine running to avoid non-start conditions in the field. Turn off all unessential electrical consumers and head to the workshop.',
  }),
};

export function evaluateThreshold(
  variable: string,
  value: number,
  vehicleType: VehicleType
): { status: StatusLevel; alert?: { title: string; message: string; advice: string } } {
  const ruleOrFn = TELEMETRY_THRESHOLDS[variable];
  if (!ruleOrFn) return { status: 'normal' };

  const rule: ThresholdRule = typeof ruleOrFn === 'function' ? ruleOrFn(vehicleType) : ruleOrFn;

  if (rule.maxCritical !== undefined && value >= rule.maxCritical) {
    return {
      status: 'critical',
      alert: {
        title: rule.warningTitle,
        message: rule.warningMessage(value, vehicleType),
        advice: rule.drivingAdvice,
      },
    };
  }
  if (rule.minCritical !== undefined && value <= rule.minCritical) {
    return {
      status: 'critical',
      alert: {
        title: rule.warningTitle,
        message: rule.warningMessage(value, vehicleType),
        advice: rule.drivingAdvice,
      },
    };
  }

  if (rule.maxWarning !== undefined && value >= rule.maxWarning) {
    return {
      status: 'warning',
      alert: {
        title: rule.warningTitle,
        message: rule.warningMessage(value, vehicleType),
        advice: rule.drivingAdvice,
      },
    };
  }
  if (rule.minWarning !== undefined && value <= rule.minWarning) {
    return {
      status: 'warning',
      alert: {
        title: rule.warningTitle,
        message: rule.warningMessage(value, vehicleType),
        advice: rule.drivingAdvice,
      },
    };
  }

  return { status: 'normal' };
}

