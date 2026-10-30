import { CoreTelemetryState, HDVTelemetryState, HydraulicTelemetryState, DTCFault } from '../../types/telemetry';

export interface DecodedJ1939Frame {
  canId: number;
  priority: number;
  pgn: number;
  sourceAddress: number;
  destinationAddress: number;
  data: number[];
}

export interface ParsedJ1939Result {
  pgn: number;
  sourceAddress: number;
  telemetryUpdates?: Partial<Record<keyof CoreTelemetryState, number>>;
  hdvUpdates?: Partial<HDVTelemetryState>;
  hydraulicUpdates?: Partial<HydraulicTelemetryState>;
  detectedFaults?: DTCFault[];
}

/**
 * Extracts 29-bit CAN header into PGN, Source Address, Destination Address.
 */
export function extractJ1939Header(canId: number): {
  priority: number;
  pgn: number;
  sourceAddress: number;
  destinationAddress: number;
} {
  const priority = (canId >> 26) & 0x07;
  const dataPage = (canId >> 24) & 0x01;
  const pduFormat = (canId >> 16) & 0xFF;
  const pduSpecific = (canId >> 8) & 0xFF;
  const sourceAddress = canId & 0xFF;

  let pgn = 0;
  let destinationAddress = 255; // Global broadcast default

  if (pduFormat < 240) {
    // PDU 1 Format (Peer-to-peer): PDU Specific is Destination Address
    pgn = (dataPage << 16) | (pduFormat << 8);
    destinationAddress = pduSpecific;
  } else {
    // PDU 2 Format (Broadcast): PDU Specific is Group Extension
    pgn = (dataPage << 16) | (pduFormat << 8) | pduSpecific;
  }

  return { priority, pgn, sourceAddress, destinationAddress };
}

/**
 * Parses raw CAN hex string in standard formats (e.g. "18FEF100 00 1A 2B 3C..." or ELM327 J1939 format).
 */
export function parseJ1939RawString(rawString: string): ParsedJ1939Result | null {
  const clean = rawString.trim().replace(/\r/g, '');
  if (!clean) return null;

  const parts = clean.split(/[\s,]+/);
  if (parts.length < 2) return null;

  const canId = parseInt(parts[0], 16);
  if (isNaN(canId)) return null;

  // Support both "CANID B0 B1 B2 B3 B4 B5 B6 B7" and "CANID 8 B0 B1 B2 B3 B4 B5 B6 B7" (with DLC byte)
  const hasDlcByte = (parts.length >= 10 && parseInt(parts[1], 10) === parts.length - 2);
  const startIdx = hasDlcByte ? 2 : 1;

  const data: number[] = [];
  for (let i = startIdx; i < parts.length; i++) {
    const byte = parseInt(parts[i], 16);
    if (!isNaN(byte)) {
      data.push(byte);
    }
  }

  const header = extractJ1939Header(canId);
  return decodeJ1939PGN(header.pgn, header.sourceAddress, data);
}

/**
 * Decodes standard SAE J1939 & ISO 11783 PGNs into telemetry and fault structures.
 */
export function decodeJ1939PGN(pgn: number, sourceAddress: number, data: number[]): ParsedJ1939Result {
  const result: ParsedJ1939Result = {
    pgn,
    sourceAddress,
    telemetryUpdates: {},
    hdvUpdates: {},
    hydraulicUpdates: {},
  };

  const d = (idx: number): number => data[idx] ?? 0;

  switch (pgn) {
    // PGN 61444 (0x0CF004): EEC1 - Electronic Engine Controller 1
    case 61444: {
      // SPN 190: Engine Speed (RPM), bytes 4-5, 0.125 RPM/bit
      const rawRpm = d(3) | (d(4) << 8);
      if (rawRpm < 0xFAFF) {
        const rpm = rawRpm * 0.125;
        result.telemetryUpdates!.rpm = Math.round(rpm);
      }
      break;
    }

    // PGN 65265 (0x18FEF1): CCVS - Cruise Control / Vehicle Speed
    case 65265: {
      // SPN 84: Wheel-based vehicle speed, bytes 2-3, 1/256 km/h per bit
      const rawSpeed = d(1) | (d(2) << 8);
      if (rawSpeed < 0xFAFF) {
        const speed = rawSpeed * (1 / 256);
        result.telemetryUpdates!.speed = Number(speed.toFixed(1));
      }
      break;
    }

    // PGN 65262 (0x18FEEE): ET1 - Engine Temperature 1
    case 65262: {
      // SPN 110: Engine Coolant Temp, byte 1, 1 °C/bit, offset -40 °C
      const rawCoolant = d(0);
      if (rawCoolant < 250) {
        const coolant = rawCoolant - 40;
        result.telemetryUpdates!.coolantTemp = coolant;
        result.telemetryUpdates!.engineTemp = coolant;
      }

      // SPN 175: Engine Oil Temp 1, bytes 3-4, 0.03125 °C/bit, offset -273 °C
      const rawOil = d(2) | (d(3) << 8);
      if (rawOil < 0xFAFF) {
        const oil = rawOil * 0.03125 - 273;
        result.telemetryUpdates!.oilTemp = Number(oil.toFixed(1));
      }
      break;
    }

    // PGN 65270 (0x18FEF6): IC1 - Inlet / Exhaust Conditions 1
    case 65270: {
      // SPN 102: Engine Turbocharger 1 Boost Pressure, byte 2, 2 kPa/bit -> bar
      const rawBoostKpa = d(1) * 2;
      result.telemetryUpdates!.boostGauge = Number((rawBoostKpa / 100).toFixed(2));
      break;
    }

    // PGN 65271 (0x18FEF7): VEP1 - Vehicle Electrical Power 1
    case 65271: {
      // SPN 168: Battery Potential (Voltage), bytes 5-6, 0.05 V/bit
      const rawVolts = d(4) | (d(5) << 8);
      if (rawVolts < 0xFAFF) {
        result.telemetryUpdates!.systemVoltage = Number((rawVolts * 0.05).toFixed(2));
      }
      break;
    }

    // PGN 65248 (0x18FEE0): VD - Vehicle Distance
    case 65248: {
      // SPN 245: Total Vehicle Distance, bytes 1-4, 0.125 km/bit
      const rawDist = (d(0) | (d(1) << 8) | (d(2) << 16) | (d(3) << 24)) >>> 0;
      if (rawDist < 0xFAFFFFFF) {
        result.telemetryUpdates!.totalDistance = Number((rawDist * 0.125).toFixed(1));
      }
      break;
    }

    // PGN 65253 (0x18FEE5): Engine Hours
    case 65253: {
      const rawHours = (d(0) | (d(1) << 8) | (d(2) << 16) | (d(3) << 24)) >>> 0;
      if (rawHours < 0xFAFFFFFF) {
        result.hdvUpdates!.engineHours = {
          value: Number((rawHours * 0.05).toFixed(1)),
          unit: 'hrs',
          status: 'normal',
        };
      }
      break;
    }

    // PGN 65198 (0x18FEAE): Air Brake Supply Pressure
    case 65198: {
      // SPN 1087 (Circuit 1, byte 1, 8 kPa/bit -> bar = / 100)
      const p1Bar = (d(0) * 8) / 100;
      // SPN 1088 (Circuit 2, byte 2, 8 kPa/bit -> bar = / 100)
      const p2Bar = (d(1) * 8) / 100;

      result.hdvUpdates!.airBrakeCircuit1 = {
        value: Number(p1Bar.toFixed(2)),
        unit: 'bar',
        status: p1Bar < 5.5 ? 'critical' : p1Bar < 6.5 ? 'warning' : 'normal',
      };
      result.hdvUpdates!.airBrakeCircuit2 = {
        value: Number(p2Bar.toFixed(2)),
        unit: 'bar',
        status: p2Bar < 5.5 ? 'critical' : p2Bar < 6.5 ? 'warning' : 'normal',
      };
      break;
    }

    // PGN 65258 (0x18FEEA): Axle Weight
    case 65258: {
      const fLoadTonnes = ((d(0) | (d(1) << 8)) * 0.5) / 1000;
      const rLoadTonnes = ((d(2) | (d(3) << 8)) * 0.5) / 1000;
      result.hdvUpdates!.axleLoadFront = {
        value: Number(fLoadTonnes.toFixed(2)),
        unit: 't',
        status: fLoadTonnes > 6.0 ? 'warning' : 'normal',
      };
      result.hdvUpdates!.axleLoadRear = {
        value: Number(rLoadTonnes.toFixed(2)),
        unit: 't',
        status: rLoadTonnes > 10.0 ? 'critical' : rLoadTonnes > 8.5 ? 'warning' : 'normal',
      };
      break;
    }

    // PGN 61462 (0x0CFE66): Air Suspension Height
    case 61462: {
      const mm = (d(0) | (d(1) << 8)) * 0.1 - 200;
      result.hdvUpdates!.suspensionHeight = {
        value: Math.round(mm),
        unit: 'mm',
        status: Math.abs(mm) > 80 ? 'warning' : 'normal',
      };
      break;
    }

    // PGN 61442 (0x0CF002): ETC1 - Transmission Controller 1
    case 61442: {
      const slipPct = d(5) * 0.4;
      result.hdvUpdates!.amtClutchSlip = {
        value: Number(slipPct.toFixed(1)),
        unit: '%',
        status: slipPct > 15 ? 'critical' : slipPct > 5 ? 'warning' : 'normal',
      };
      break;
    }

    // PGN 61440 (0x0CF000): ERC1 - Electronic Retarder Controller 1
    case 61440: {
      const stage = d(0) & 0x03;
      const torquePct = d(1) * 0.4 - 125;
      result.hdvUpdates!.retarderStage = stage;
      result.hdvUpdates!.retarderTorquePct = {
        value: Math.max(0, Math.round(torquePct)),
        unit: '%',
        status: 'normal',
      };
      break;
    }

    // PGN 65264 (0x18FEF0): PTO Information
    case 65264: {
      const engaged = (d(0) & 0x03) === 1;
      const rawSpeed = d(1) | (d(2) << 8);
      const ptoRpm = rawSpeed * 0.125;
      result.hdvUpdates!.ptoEngaged = engaged;
      result.hdvUpdates!.ptoSpeed = {
        value: Math.round(ptoRpm),
        unit: 'RPM',
        status: 'normal',
      };
      break;
    }

    // PGN 65226 (0x18FECA): DM1 - Active Diagnostic Trouble Codes
    case 65226: {
      // Byte 1-2: Lamp status
      const protectLamp = (d(0) >> 0) & 0x03;
      const amberLamp = (d(0) >> 2) & 0x03;
      const redStopLamp = (d(0) >> 4) & 0x03;

      const faults: DTCFault[] = [];
      // Each DTC is 4 bytes starting at byte 3: SPN (19 bits) + FMI (5 bits) + Occurrence (7 bits)
      for (let i = 2; i + 4 <= data.length; i += 4) {
        const spnByte1 = d(i);
        const spnByte2 = d(i + 1);
        const spnByte3AndFmi = d(i + 2);
        const occurrence = d(i + 3) & 0x7F;

        const spn = spnByte1 | (spnByte2 << 8) | ((spnByte3AndFmi & 0xE0) << 11);
        const fmi = spnByte3AndFmi & 0x1F;

        if (spn > 0) {
          const faultKey = `SPN ${spn} FMI ${fmi}`;
          faults.push({
            code: faultKey,
            source: 'J1939',
            spn,
            fmi,
            title: `J1939 DM1 Fault: SPN ${spn} FMI ${fmi}`,
            description: `Active heavy-duty tractor diagnostic code transmitted on DM1 broadcast frame.`,
            severity: redStopLamp === 1 || fmi === 1 || fmi === 0 ? 'critical' : 'warning',
            drivingAdvice: 'Inspect tractor operating conditions. Disengage heavy implement load.',
            potentialCauses: ['Sensor harness disconnect', 'Sensor circuit voltage out of range'],
            diagnosticSteps: ['Check J1939 9-pin Deutsch breakout voltage', 'Inspect sensor pins'],
            occurrenceCount: occurrence,
            lampStatus: redStopLamp === 1 ? 'RED_STOP' : amberLamp === 1 ? 'AMBER_WARNING' : 'NONE',
            timestamp: Date.now(),
          });
        }
      }
      if (faults.length > 0) {
        result.detectedFaults = faults;
      }
      break;
    }

    // PGN 65300: Proprietary Tractor Auxiliary / Hydraulic System
    case 65300: {
      const resLevel = d(0);
      const resTemp = d(1) - 40;
      const pumpFlow = d(2);
      const pumpPress = (d(3) | (d(4) << 8)) * 0.1;
      const scv1 = d(5) - 100;

      result.hydraulicUpdates!.reservoirLevel = {
        value: resLevel,
        unit: '%',
        status: resLevel < 20 ? 'critical' : resLevel < 35 ? 'warning' : 'normal',
      };
      result.hydraulicUpdates!.reservoirTemp = {
        value: resTemp,
        unit: '°C',
        status: resTemp > 95 ? 'critical' : resTemp > 80 ? 'warning' : 'normal',
      };
      result.hydraulicUpdates!.pumpFlowRate = {
        value: pumpFlow,
        unit: 'L/min',
        status: 'normal',
      };
      result.hydraulicUpdates!.pumpDischargePressure = {
        value: Number(pumpPress.toFixed(1)),
        unit: 'bar',
        status: pumpPress > 225 ? 'critical' : pumpPress > 210 ? 'warning' : 'normal',
      };
      result.hydraulicUpdates!.controlValveSCV1 = {
        value: scv1,
        unit: '%',
        status: 'normal',
      };
      break;
    }

    default:
      break;
  }

  return result;
}

