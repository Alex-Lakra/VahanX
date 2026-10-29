import { DTCFault } from '../types/telemetry';

export interface DTCEntry {
  code: string;
  source: 'OBD2' | 'J1939';
  spn?: number;
  fmi?: number;
  title: string;
  description: string;
  severity: 'normal' | 'warning' | 'critical';
  drivingAdvice: string;
  potentialCauses: string[];
  diagnosticSteps: string[];
}

export const DTC_DATABASE: Record<string, DTCEntry> = {
  // === OBD-II Standard Trouble Codes ===
  'P0524': {
    code: 'P0524',
    source: 'OBD2',
    title: 'Engine Oil Pressure Too Low',
    description: 'The Engine Control Module (ECM) detected that engine oil pressure dropped below the minimum critical lubrication threshold.',
    severity: 'critical',
    drivingAdvice: 'IMMEDIATELY PULL OVER SAFELY AND SHUT OFF ENGINE. Do not restart. Prolonged running will cause complete rod bearing seizure and crankshaft destruction.',
    potentialCauses: [
      'Clogged oil pump pickup screen strainer',
      'Severely depleted engine oil level',
      'Worn oil pump internal gerotor gears',
      'Degraded engine oil viscosity from fuel dilution',
      'Faulty oil pressure switch or sensor wire harness'
    ],
    diagnosticSteps: [
      'Verify physical dipstick oil level and inspect for milky coolant emulsion',
      'Screw in a mechanical master pressure gauge to verify true hydraulic head pressure',
      'Inspect oil filter canister for metal filings and debris',
      'Check oil pressure relief valve plunger for stuck-open condition'
    ]
  },

  'P0217': {
    code: 'P0217',
    source: 'OBD2',
    title: 'Engine Coolant Over-Temperature Condition',
    description: 'Engine coolant temperature has exceeded the thermal safety limit (>108 °C).',
    severity: 'critical',
    drivingAdvice: 'Reduce speed smoothly, shift to neutral, and idle. Turn cabin heater to maximum blower speed. Shut off if temperature does not decline within 60 seconds.',
    potentialCauses: [
      'Stuck-closed mechanical thermostat',
      'Coolant loss due to ruptured radiator hose or heater core',
      'Radiator airflow blocked with agricultural chaff, dust, or mud',
      'Electric or viscous cooling fan clutch failure',
      'Blown cylinder head gasket combustion breach'
    ],
    diagnosticSteps: [
      'Visually inspect radiator front matrix for chaff clogging',
      'Check coolant expansion tank level when cool (never open hot)',
      'Inspect serpentine belt tension on water pump pulley',
      'Perform chemical combustion block test on radiator neck'
    ]
  },

  'P0234': {
    code: 'P0234',
    source: 'OBD2',
    title: 'Turbocharger / Supercharger Overboost Condition',
    description: 'Manifold absolute pressure exceeded maximum calibrated boost safety ceiling.',
    severity: 'warning',
    drivingAdvice: 'Avoid wide-open throttle. Keep engine under moderate mid-range RPM. Ease pedal off progressively.',
    potentialCauses: [
      'Stuck wastegate actuator linkage',
      'Split or severed vacuum/boost line to boost control solenoid',
      'Defective wastegate control frequency solenoid valve (N75)',
      'Excessive soot carbon buildup inside Variable Nozzle Turbine (VNT) vanes'
    ],
    diagnosticSteps: [
      'Check mechanical movement of wastegate arm with a vacuum hand pump',
      'Test boost solenoid PWM duty cycle via diagnostic actuation test',
      'Inspect MAP sensor wiring and reference voltage'
    ]
  },

  'P0113': {
    code: 'P0113',
    source: 'OBD2',
    title: 'Intake Air Temperature Sensor 1 Circuit High',
    description: 'IAT sensor circuit voltage exceeded 4.6V (indicative of open circuit or disconnected sensor).',
    severity: 'warning',
    drivingAdvice: 'Vehicle remains drivable. Engine may exhibit rich cold-start fueling and elevated diesel smoke opacity.',
    potentialCauses: [
      'IAT sensor unplugged or loose connector pin',
      'Broken signal wire in engine harness',
      'Internal open circuit in thermistor element'
    ],
    diagnosticSteps: [
      'Measure resistance across sensor terminals and compare against temperature-resistance chart',
      'Verify 5.0V reference from ECM at harness plug'
    ]
  },

  'P0300': {
    code: 'P0300',
    source: 'OBD2',
    title: 'Random / Multiple Cylinder Misfire Detected',
    description: 'Crankshaft acceleration variations show multiple combustion events failed to ignite.',
    severity: 'warning',
    drivingAdvice: 'Avoid heavy towing or high throttle load. If check engine light flashes rapidly, catalyst melting risk is imminent.',
    potentialCauses: [
      'Contaminated or water-logged diesel fuel',
      'Failing high-pressure common rail injector',
      'Low fuel supply pump delivery pressure',
      'EGR valve stuck partially open causing intake dilution'
    ],
    diagnosticSteps: [
      'Read cylinder-by-cylinder smooth running / injector quantity balance',
      'Check fuel rail pressure during cranking and snap-throttle',
      'Perform low-pressure fuel supply circuit volume test'
    ]
  },

  'P2463': {
    code: 'P2463',
    source: 'OBD2',
    title: 'Diesel Particulate Filter (DPF) - Soot Accumulation',
    description: 'DPF soot load level has exceeded maximum regeneration threshold (>85%).',
    severity: 'warning',
    drivingAdvice: 'Execute an active highway regeneration drive (sustained >60 km/h at 2,000 RPM for 25 minutes). Avoid short stop-and-go trips.',
    potentialCauses: [
      'Excessive short-distance lugging without reaching exhaust regen temperatures',
      'Faulty DPF differential pressure sensor lines cracked or full of moisture',
      'Failed exhaust gas temperature (EGT) sensor pre-DPF'
    ],
    diagnosticSteps: [
      'Read differential pressure across DPF at idle and 2,500 RPM',
      'Trigger stationary manual service regeneration if soot is under 90%'
    ]
  },

  // === J1939 Heavy-Duty SPN + FMI Faults ===
  'SPN 100 FMI 1': {
    code: 'SPN 100 FMI 1',
    source: 'J1939',
    spn: 100,
    fmi: 1,
    title: 'Engine Oil Pressure - Valid Data Below Most Severe Operational Limit',
    description: 'J1939 broadcast frame reports engine lube gallery pressure is below engine protection threshold.',
    severity: 'critical',
    drivingAdvice: 'SHUT DOWN TRACTOR ENGINE IMMEDIATELY. Disengage PTO and all remote hydraulic valves. Risk of catastrophic main bearing seizure.',
    potentialCauses: [
      'Severe engine oil loss',
      'Oil pump pressure relief spring fractured or stuck open',
      'Hydraulic oil cooler cross-contamination',
      'Oil pump drive gear key sheared'
    ],
    diagnosticSteps: [
      'Check tractor oil dipstick level and color',
      'Connect mechanical gauge to main oil gallery test port on engine block',
      'Verify J1939 PGN 65262 byte 4 oil pressure sensor signal voltage'
    ]
  },

  'SPN 110 FMI 0': {
    code: 'SPN 110 FMI 0',
    source: 'J1939',
    spn: 110,
    fmi: 0,
    title: 'Engine Coolant Temperature - Valid Data Above Most Severe Limit',
    description: 'Engine coolant has exceeded 105 °C under field operating conditions.',
    severity: 'critical',
    drivingAdvice: 'Drop 3-point hitch implement to ground, shift transmission to neutral, and run engine at 1,200 RPM without load to allow water pump circulation.',
    potentialCauses: [
      'Radiator screen completely packed with field chaff or stubble',
      'Viscous fan drive thermal bi-metal spring defective',
      'Coolant cavitation or air-pocket in cylinder head'
    ],
    diagnosticSteps: [
      'Blow out radiator cooling pack with compressed air from back to front',
      'Inspect fan blade condition and drive belt tension'
    ]
  },

  'SPN 1087 FMI 1': {
    code: 'SPN 1087 FMI 1',
    source: 'J1939',
    spn: 1087,
    fmi: 1,
    title: 'Air Brake Supply Pressure 1 - Critically Low (< 5.5 bar / 80 PSI)',
    description: 'Pneumatic air brake primary supply tank pressure is below emergency spring brake lockup threshold.',
    severity: 'critical',
    drivingAdvice: 'DO NOT DRIVE ON PUBLIC HIGHWAYS. Trailer pneumatic spring brakes will auto-lock catastrophically once pressure falls below 4.5 bar.',
    potentialCauses: [
      'Air compressor unloader valve stuck open',
      'Ruptured airline to trailer glad-hand couplers',
      'Desiccant air dryer purge valve stuck leaking',
      'Severed pneumatic brake line'
    ],
    diagnosticSteps: [
      'Listen for continuous air audible hiss along chassis rails',
      'Check air dryer purge valve exhaust port for continuous discharge',
      'Verify compressor governor cut-in / cut-out pressures'
    ]
  },

  'SPN 522 FMI 7': {
    code: 'SPN 522 FMI 7',
    source: 'J1939',
    spn: 522,
    fmi: 7,
    title: 'Transmission Clutch Slip - Mechanical System Not Responding Properly',
    description: 'AMT or Powershift clutch pack differential RPM indicates clutch slipping under current torque demand.',
    severity: 'critical',
    drivingAdvice: 'Immediately reduce tractor drawbar draft load. Do not operate in high powershift ranges under heavy load to prevent clutch pack burnout.',
    potentialCauses: [
      'Low transmission main hydraulic lube pressure',
      'Worn wet clutch friction plates',
      'Proportional shift valve spool jammed by fine metal contamination'
    ],
    diagnosticSteps: [
      'Measure transmission main system pressure at test port',
      'Inspect transmission hydraulic filter for clutch bronze particulate'
    ]
  },

  'SPN 979 FMI 14': {
    code: 'SPN 979 FMI 14',
    source: 'J1939',
    spn: 979,
    fmi: 14,
    title: 'PTO Engagement - Safety Interlock or Clutch Slip Discrepancy',
    description: 'PTO speed sensor differential exceeds allowable slip envelope or shield interlock broken.',
    severity: 'warning',
    drivingAdvice: 'Disengage PTO in cab immediately. Inspect implement PTO shaft, universal joints, and slip-clutch before re-engaging.',
    potentialCauses: [
      'Agricultural implement rotavator/baler choked or mechanically jammed',
      'PTO wet clutch hydraulic pressure below 14 bar',
      'PTO speed pickup magnetic sensor gap incorrect'
    ],
    diagnosticSteps: [
      'Check implement driveshaft for foreign debris/wire wrapping',
      'Test PTO solenoid resistance (typical 8–12 ohms)'
    ]
  },

  'SPN 1873 FMI 2': {
    code: 'SPN 1873 FMI 2',
    source: 'J1939',
    spn: 1873,
    fmi: 2,
    title: 'Three-Point Hitch Rockshaft Position - Signal Erratic',
    description: 'Hitch position potentiometer feedback is fluctuating rapidly, disrupting draft control.',
    severity: 'warning',
    drivingAdvice: 'Switch 3-point hitch from "Draft Control" mode to "Position Control" mode to prevent implement hunting.',
    potentialCauses: [
      'Rockshaft position rotary sensor worn or flooded with water',
      'Loose sensor linkage arm on cross-shaft',
      'Wiring harness chafed against rear lift arm'
    ],
    diagnosticSteps: [
      'Inspect mechanical linkage connecting hitch rockshaft to rotary sensor',
      'Observe sensor live signal on multimeter while cycling lift manually'
    ]
  }
};

export function lookupDTC(codeOrSpn: string): DTCEntry {
  if (DTC_DATABASE[codeOrSpn]) {
    return DTC_DATABASE[codeOrSpn];
  }

  // Fallback for unrecognized codes
  const isJ1939 = codeOrSpn.startsWith('SPN');
  return {
    code: codeOrSpn,
    source: isJ1939 ? 'J1939' : 'OBD2',
    title: isJ1939 ? `Heavy-Duty Diagnostic Fault (${codeOrSpn})` : `Diagnostic Trouble Code ${codeOrSpn}`,
    description: `Active fault flagged on ${isJ1939 ? 'SAE J1939 CAN bus (DM1/DM2)' : 'OBD-II vehicle diagnostic bus'}.`,
    severity: 'warning',
    drivingAdvice: 'Exercise caution while operating vehicle. Inspect sensor connectors and perform diagnostic scan at nearest repair center.',
    potentialCauses: [
      'Intermittent wiring harness connector resistance',
      'Sensor reference circuit degradation',
      'ECU broadcast timeout'
    ],
    diagnosticSteps: [
      'Inspect physical connector pins for corrosion or bent pins',
      'Measure sensor circuit ground integrity with digital multimeter'
    ]
  };
}

