export type VehicleType = 'LMV' | 'HDV';

export type StatusLevel = 'normal' | 'warning' | 'critical';

export interface TelemetryValue<T = number> {
  value: T;
  unit: string;
  status: StatusLevel;
  minSafe?: number;
  maxSafe?: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export interface CoreTelemetryState {
  speed: TelemetryValue;
  engineTemp: TelemetryValue;
  oilTemp: TelemetryValue;
  rpm: TelemetryValue;
  boostGauge: TelemetryValue;
  coolantTemp: TelemetryValue;
  totalDistance: TelemetryValue;
  batterySoC: TelemetryValue;
  systemVoltage: TelemetryValue;
  timestamp: number;
}

export interface DashboardAlert {
  id: string;
  variable: keyof CoreTelemetryState | string;
  title: string;
  message: string;
  drivingAdvice: string;
  level: StatusLevel;
  timestamp: number;
}

export interface HDVTelemetryState {
  airBrakeCircuit1: TelemetryValue; // bar (critical < 5.5 bar)
  airBrakeCircuit2: TelemetryValue; // bar
  axleLoadFront: TelemetryValue; // tonnes
  axleLoadRear: TelemetryValue; // tonnes
  suspensionHeight: TelemetryValue; // mm
  amtClutchSlip: TelemetryValue; // %
  amtShaftSpeedDiff: TelemetryValue; // RPM
  retarderStage: number; // 0, 1, 2, 3
  retarderTorquePct: TelemetryValue; // %
  ptoEngaged: boolean;
  ptoSpeed: TelemetryValue; // RPM (540 / 540E / 1000)
  ptoTargetSpeed: 540 | 750 | 1000;
  ptoClutchSlip: TelemetryValue; // %
  ptoTorque: TelemetryValue; // Nm
  ptoShieldInterlock: boolean;
  noxPreSCR: TelemetryValue; // ppm
  noxPostSCR: TelemetryValue; // ppm
  dpfSootLoad: TelemetryValue; // %
  adBlueLevel: TelemetryValue; // %
  smokeOpacity: TelemetryValue; // %
  engineHours: TelemetryValue; // hrs
  // Drawbar & Towing
  drawbarDraftForce: TelemetryValue; // kN
  tongueWeight: TelemetryValue; // kg
  hitchLockEngaged: boolean;
  trailerLightingContinuity: boolean;
  wheelSlipPct: TelemetryValue; // % (ground vs wheel speed)
  // ISOBUS
  isobusImplementName: string;
  isobusWorkingWidthMeters: number;
  isobusFoldLockEngaged: boolean;
  isobusApplicationRate: TelemetryValue; // kg/ha or L/ha
}

export interface HydraulicTelemetryState {
  // Top 3-Module Sub-Dashboard
  reservoirLevel: TelemetryValue; // %
  reservoirTemp: TelemetryValue; // °C
  reservoirMoistureAeration: 'LOW' | 'MEDIUM' | 'HIGH';
  pumpFlowRate: TelemetryValue; // L/min
  pumpDischargePressure: TelemetryValue; // bar
  pumpDriveTorque: TelemetryValue; // Nm
  pumpVolumetricEfficiency: TelemetryValue; // %
  controlValveSCV1: TelemetryValue; // -100% to +100%
  controlValveSCV2: TelemetryValue; // -100% to +100%
  controlValveSolenoidCurrent: TelemetryValue; // mA
  // Remaining 6 Components
  filterPressureDiff: TelemetryValue; // bar (delta P)
  filterBypassActive: boolean;
  reliefValveCrackingPressure: TelemetryValue; // bar
  reliefValveBlowByDetected: boolean;
  hoseLeakRiskLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  cylinderDriftRatePctMin: TelemetryValue; // %/min
  pistonRodStrainMicrostrain: TelemetryValue;
  threePointHitchPosition: TelemetryValue; // %
  threePointHitchPayloadKg: TelemetryValue; // kg
}

export interface DTCFault {
  code: string; // e.g. P0524 or SPN 100 FMI 1
  source: 'OBD2' | 'J1939';
  spn?: number;
  fmi?: number;
  title: string;
  description: string;
  severity: StatusLevel;
  drivingAdvice: string;
  potentialCauses: string[];
  diagnosticSteps: string[];
  occurrenceCount?: number;
  lampStatus?: 'NONE' | 'AMBER_WARNING' | 'RED_STOP' | 'PROTECT';
  timestamp: number;
}

