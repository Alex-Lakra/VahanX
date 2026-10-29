import { CoreTelemetryState, HDVTelemetryState, DTCFault, VehicleType } from '../types/telemetry';

export interface CategoryScore {
  id: 'faults_oil' | 'thermal' | 'drivetrain_hydraulics' | 'electrical' | 'emissions_service';
  name: string;
  weight: number; // e.g. 35, 25, 20, 10, 10
  score: number; // 0 to 100 within category
  penaltyPoints: number; // contribution to total deduction
  deductionReasons: string[];
}

export interface MasterHealthResult {
  score: number; // 0 to 100
  statusBand: 'GREEN' | 'AMBER' | 'RED';
  categories: CategoryScore[];
  limpModeTriggerRecommended: boolean;
}

export class HealthScoreEngine {
  static evaluate(
    core: CoreTelemetryState,
    hdv: HDVTelemetryState | null,
    hydraulicsScore: number, // 0-100
    activeFaults: DTCFault[],
    vehicleType: VehicleType
  ): MasterHealthResult {
    // 1. Category A: Active Fault Codes & Lubrication Pressure (35%)
    let catAPenalty = 0;
    const catAReasons: string[] = [];

    // Check critical fault codes
    const criticalFaults = activeFaults.filter((f) => f.severity === 'critical');
    const warningFaults = activeFaults.filter((f) => f.severity === 'warning');

    if (criticalFaults.length > 0) {
      catAPenalty += 0.85; // 85% penalty in category
      catAReasons.push(`${criticalFaults.length} critical fault code(s) active`);
    } else if (warningFaults.length > 0) {
      catAPenalty += Math.min(0.5, warningFaults.length * 0.15);
      catAReasons.push(`${warningFaults.length} advisory trouble code(s) active`);
    }

    // Oil Temp check
    if (core.oilTemp.value > 125) {
      catAPenalty = Math.min(1.0, catAPenalty + 0.4);
      catAReasons.push(`Oil temperature critical (${core.oilTemp.value}°C)`);
    } else if (core.oilTemp.value > 115) {
      catAPenalty = Math.min(1.0, catAPenalty + 0.15);
      catAReasons.push(`Oil temperature elevated (${core.oilTemp.value}°C)`);
    }

    const catAScore = Math.max(0, Math.round(100 * (1 - catAPenalty)));

    // 2. Category B: Engine & Coolant Thermal Stability (25%)
    let catBPenalty = 0;
    const catBReasons: string[] = [];

    const coolantMax = vehicleType === 'HDV' ? 103 : 105;
    if (core.coolantTemp.value > coolantMax) {
      catBPenalty += 0.8;
      catBReasons.push(`Coolant boiling hazard (${core.coolantTemp.value}°C)`);
    } else if (core.coolantTemp.value > 98) {
      catBPenalty += 0.3;
      catBReasons.push(`Coolant temperature elevated (${core.coolantTemp.value}°C)`);
    }

    const boostMax = vehicleType === 'HDV' ? 2.8 : 2.2;
    if (core.boostGauge.value > boostMax) {
      catBPenalty = Math.min(1.0, catBPenalty + 0.3);
      catBReasons.push(`Turbo overboost spike (${core.boostGauge.value} bar)`);
    }

    const catBScore = Math.max(0, Math.round(100 * (1 - catBPenalty)));

    // 3. Category C: Drivetrain, Brakes & Hydraulics (20%)
    let catCPenalty = 0;
    const catCReasons: string[] = [];

    if (vehicleType === 'HDV' && hdv) {
      // 60% driven by hydraulics sub-score, 40% by brakes and transmission
      const hydDeficit = (100 - hydraulicsScore) / 100;
      catCPenalty += hydDeficit * 0.6;
      if (hydDeficit > 0.2) {
        catCReasons.push(`Hydraulics subsystem score degraded (${hydraulicsScore}/100)`);
      }

      // Air brake check (critical < 5.5 bar)
      if (hdv.airBrakeCircuit1.value < 5.5 || hdv.airBrakeCircuit2.value < 5.5) {
        catCPenalty = Math.min(1.0, catCPenalty + 0.4);
        catCReasons.push(`Air brake reservoir pressure critical (<5.5 bar)`);
      }

      // AMT clutch slip
      if (hdv.amtClutchSlip.value > 15) {
        catCPenalty = Math.min(1.0, catCPenalty + 0.25);
        catCReasons.push(`Transmission clutch slip excessive (${hdv.amtClutchSlip.value}%)`);
      }
    } else {
      // LMV Drivetrain
      if (core.rpm.status === 'critical') {
        catCPenalty += 0.4;
        catCReasons.push('Engine over-revving');
      }
    }

    const catCScore = Math.max(0, Math.round(100 * (1 - catCPenalty)));

    // 4. Category D: Electrical System & Battery State of Charge (10%)
    let catDPenalty = 0;
    const catDReasons: string[] = [];

    if (core.batterySoC.value < 25) {
      catDPenalty += 0.8;
      catDReasons.push(`Battery state of charge low (${core.batterySoC.value}%)`);
    } else if (core.batterySoC.value < 40) {
      catDPenalty += 0.3;
      catDReasons.push(`Battery reserve moderate (${core.batterySoC.value}%)`);
    }

    if (core.systemVoltage.status === 'critical') {
      catDPenalty = Math.min(1.0, catDPenalty + 0.5);
      catDReasons.push(`System voltage anomaly (${core.systemVoltage.value}V)`);
    }

    const catDScore = Math.max(0, Math.round(100 * (1 - catDPenalty)));

    // 5. Category E: Emissions, Exhaust & Service Schedule (10%)
    let catEPenalty = 0;
    const catEReasons: string[] = [];

    if (vehicleType === 'HDV' && hdv) {
      if (hdv.dpfSootLoad.value > 80) {
        catEPenalty += 0.5;
        catEReasons.push(`DPF soot load high (${hdv.dpfSootLoad.value}%)`);
      }
      if (hdv.adBlueLevel.value < 15) {
        catEPenalty += 0.3;
        catEReasons.push(`AdBlue / DEF fluid low (${hdv.adBlueLevel.value}%)`);
      }
    }

    if (core.totalDistance.status === 'critical') {
      catEPenalty = Math.min(1.0, catEPenalty + 0.3);
      catEReasons.push('Service interval exceeded');
    }

    const catEScore = Math.max(0, Math.round(100 * (1 - catEPenalty)));

    // Composite master score calculation:
    // Score = 100 - sum(Weight_i * Penalty_i)
    const weightA = 35;
    const weightB = 25;
    const weightC = 20;
    const weightD = 10;
    const weightE = 10;

    const penaltyA = (weightA * (100 - catAScore)) / 100;
    const penaltyB = (weightB * (100 - catBScore)) / 100;
    const penaltyC = (weightC * (100 - catCScore)) / 100;
    const penaltyD = (weightD * (100 - catDScore)) / 100;
    const penaltyE = (weightE * (100 - catEScore)) / 100;

    const totalDeductions = penaltyA + penaltyB + penaltyC + penaltyD + penaltyE;
    const finalScore = Math.max(0, Math.min(100, Math.round(100 - totalDeductions)));

    const statusBand: 'GREEN' | 'AMBER' | 'RED' =
      finalScore >= 80 ? 'GREEN' : finalScore >= 40 ? 'AMBER' : 'RED';

    const limpModeTriggerRecommended =
      statusBand === 'RED' ||
      criticalFaults.length > 0 ||
      (vehicleType === 'HDV' && hdv ? hdv.airBrakeCircuit1.value < 5.5 : false);

    const categories: CategoryScore[] = [
      {
        id: 'faults_oil',
        name: 'Active DTCs & Lubrication',
        weight: weightA,
        score: catAScore,
        penaltyPoints: Number(penaltyA.toFixed(1)),
        deductionReasons: catAReasons,
      },
      {
        id: 'thermal',
        name: 'Thermal & Coolant Stability',
        weight: weightB,
        score: catBScore,
        penaltyPoints: Number(penaltyB.toFixed(1)),
        deductionReasons: catBReasons,
      },
      {
        id: 'drivetrain_hydraulics',
        name: 'Drivetrain, Brakes & Hydraulics',
        weight: weightC,
        score: catCScore,
        penaltyPoints: Number(penaltyC.toFixed(1)),
        deductionReasons: catCReasons,
      },
      {
        id: 'electrical',
        name: 'Electrical & Battery SoC',
        weight: weightD,
        score: catDScore,
        penaltyPoints: Number(penaltyD.toFixed(1)),
        deductionReasons: catDReasons,
      },
      {
        id: 'emissions_service',
        name: 'Emissions & Service Schedule',
        weight: weightE,
        score: catEScore,
        penaltyPoints: Number(penaltyE.toFixed(1)),
        deductionReasons: catEReasons,
      },
    ];

    return {
      score: finalScore,
      statusBand,
      categories,
      limpModeTriggerRecommended,
    };
  }
}

