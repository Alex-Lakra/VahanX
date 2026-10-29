import { HydraulicTelemetryState } from '../types/telemetry';

export interface HydraulicComponentScore {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of total hydraulics score
  score: number; // 0 to 100
  status: 'normal' | 'warning' | 'critical';
  metricsSummary: string;
}

export interface HydraulicsHealthResult {
  compositeScore: number; // 0 to 100
  status: 'normal' | 'warning' | 'critical';
  components: HydraulicComponentScore[];
}

export class HydraulicsHealthEngine {
  static evaluate(state: HydraulicTelemetryState): HydraulicsHealthResult {
    const components: HydraulicComponentScore[] = [];

    // 1. Hydraulic Pump (30%)
    let pumpScore = 100;
    if (state.pumpDischargePressure.value > 225) pumpScore -= 40;
    else if (state.pumpDischargePressure.value > 210) pumpScore -= 15;
    if (state.pumpVolumetricEfficiency.value < 75) pumpScore -= 30;
    else if (state.pumpVolumetricEfficiency.value < 85) pumpScore -= 10;
    pumpScore = Math.max(0, pumpScore);
    components.push({
      id: 'pump',
      name: 'Hydraulic Pump',
      description: 'Supplies high-pressure hydraulic oil flow to remotes and hitch',
      weight: 30,
      score: pumpScore,
      status: pumpScore < 60 ? 'critical' : pumpScore < 80 ? 'warning' : 'normal',
      metricsSummary: `Flow: ${state.pumpFlowRate.value} L/min | Press: ${state.pumpDischargePressure.value} bar | Eff: ${state.pumpVolumetricEfficiency.value}%`,
    });

    // 2. Hydraulic Oil Reservoir (25%)
    let resScore = 100;
    if (state.reservoirLevel.value < 25) resScore -= 50;
    else if (state.reservoirLevel.value < 40) resScore -= 20;
    if (state.reservoirTemp.value > 95) resScore -= 40;
    else if (state.reservoirTemp.value > 80) resScore -= 15;
    if (state.reservoirMoistureAeration === 'HIGH') resScore -= 30;
    else if (state.reservoirMoistureAeration === 'MEDIUM') resScore -= 10;
    resScore = Math.max(0, resScore);
    components.push({
      id: 'reservoir',
      name: 'Hydraulic Oil Reservoir',
      description: 'Stores, de-aerates and cools hydraulic fluid',
      weight: 25,
      score: resScore,
      status: resScore < 60 ? 'critical' : resScore < 80 ? 'warning' : 'normal',
      metricsSummary: `Level: ${state.reservoirLevel.value}% | Temp: ${state.reservoirTemp.value}°C | Aeration: ${state.reservoirMoistureAeration}`,
    });

    // 3. Hydraulic Filter (15%)
    let filterScore = 100;
    if (state.filterBypassActive) filterScore -= 50;
    if (state.filterPressureDiff.value > 3.5) filterScore -= 40;
    else if (state.filterPressureDiff.value > 2.5) filterScore -= 15;
    filterScore = Math.max(0, filterScore);
    components.push({
      id: 'filter',
      name: 'Hydraulic Filter',
      description: 'Removes micron-scale wear particles and particulate contaminants',
      weight: 15,
      score: filterScore,
      status: filterScore < 60 ? 'critical' : filterScore < 80 ? 'warning' : 'normal',
      metricsSummary: `ΔP: ${state.filterPressureDiff.value} bar | Bypass Valve: ${state.filterBypassActive ? 'OPEN (SATURATED)' : 'Closed'}`,
    });

    // 4. Control Valve (SCVs) (12%)
    let scvScore = 100;
    if (state.controlValveSolenoidCurrent.value < 200 || state.controlValveSolenoidCurrent.value > 1200) scvScore -= 35;
    scvScore = Math.max(0, scvScore);
    components.push({
      id: 'control_valve',
      name: 'Control Valve (SCVs)',
      description: 'Directs oil flow to implements via proportional spool valves',
      weight: 12,
      score: scvScore,
      status: scvScore < 60 ? 'critical' : scvScore < 80 ? 'warning' : 'normal',
      metricsSummary: `SCV 1: ${state.controlValveSCV1.value}% | SCV 2: ${state.controlValveSCV2.value}% | Driver: ${state.controlValveSolenoidCurrent.value} mA`,
    });

    // 5. Pressure Relief Valve (8%)
    let reliefScore = 100;
    if (state.reliefValveBlowByDetected) reliefScore -= 40;
    if (state.reliefValveCrackingPressure.value > 220) reliefScore -= 20;
    reliefScore = Math.max(0, reliefScore);
    components.push({
      id: 'relief_valve',
      name: 'Pressure Relief Valve',
      description: 'Prevents system over-pressurization & burst hazards',
      weight: 8,
      score: reliefScore,
      status: reliefScore < 60 ? 'critical' : reliefScore < 80 ? 'warning' : 'normal',
      metricsSummary: `Cracking: ${state.reliefValveCrackingPressure.value} bar | Continuous Blow-by: ${state.reliefValveBlowByDetected ? 'YES' : 'No'}`,
    });

    // 6. Hydraulic Hoses & Hard Lines (3%)
    let hoseScore = state.hoseLeakRiskLevel === 'CRITICAL' ? 30 : state.hoseLeakRiskLevel === 'ELEVATED' ? 70 : 100;
    components.push({
      id: 'hoses',
      name: 'Hydraulic Hoses & Pipes',
      description: 'Carries high-pressure oil without bursting or weeping',
      weight: 3,
      score: hoseScore,
      status: hoseScore < 60 ? 'critical' : hoseScore < 80 ? 'warning' : 'normal',
      metricsSummary: `Dynamic Leak Risk: ${state.hoseLeakRiskLevel}`,
    });

    // 7. Hydraulic Cylinder & Piston (3%)
    let cylScore = 100;
    if (state.cylinderDriftRatePctMin.value > 2.0) cylScore -= 40;
    cylScore = Math.max(0, cylScore);
    components.push({
      id: 'cylinders',
      name: 'Hydraulic Cylinders & Piston',
      description: 'Converts fluid energy into mechanical lifting force',
      weight: 3,
      score: cylScore,
      status: cylScore < 60 ? 'critical' : cylScore < 80 ? 'warning' : 'normal',
      metricsSummary: `Neutral Drift Rate: ${state.cylinderDriftRatePctMin.value}%/min (Max safe 2.0%)`,
    });

    // 8. Piston Rod & Linkage (2%)
    let rodScore = state.pistonRodStrainMicrostrain.value > 1200 ? 60 : 100;
    components.push({
      id: 'rod_linkage',
      name: 'Piston Rod & Mechanical Linkage',
      description: 'Transfers ram thrust to hitch rockshaft arms',
      weight: 2,
      score: rodScore,
      status: rodScore < 80 ? 'warning' : 'normal',
      metricsSummary: `Strain Gauge: ${state.pistonRodStrainMicrostrain.value} µε`,
    });

    // 9. Three-Point Hitch / Lifting Mechanism (2%)
    let hitchScore = 100;
    components.push({
      id: 'three_point_hitch',
      name: 'Three-Point Hitch Mechanism',
      description: 'Couples and controls implement operating depth and height',
      weight: 2,
      score: hitchScore,
      status: 'normal',
      metricsSummary: `Rockshaft: ${state.threePointHitchPosition.value}% | Payload: ${state.threePointHitchPayloadKg.value} kg`,
    });

    // Calculate composite weighted score
    let totalScore = 0;
    for (const comp of components) {
      totalScore += (comp.score * comp.weight) / 100;
    }
    const compositeScore = Math.round(totalScore);

    return {
      compositeScore,
      status: compositeScore < 60 ? 'critical' : compositeScore < 80 ? 'warning' : 'normal',
      components,
    };
  }
}

