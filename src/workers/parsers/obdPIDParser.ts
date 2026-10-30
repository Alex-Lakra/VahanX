import { CoreTelemetryState } from '../../types/telemetry';

export interface ParsedOBDResult {
  telemetryUpdates?: Partial<Record<keyof CoreTelemetryState, number>>;
  detectedDTCs?: string[];
  isPid00Supported?: boolean;
}

/**
 * Strips whitespace, echoes, prompts, and hex-decodes ELM327 / OBD-II frames.
 */
export function cleanELMResponse(raw: string): string {
  return raw.replace(/[\r\n\s>]/g, '').toUpperCase();
}

/**
 * Decodes standard OBD-II Mode 01 responses (e.g. "41 0C 1A F8" -> RPM)
 * and Mode 03/07 DTC responses (e.g. "7E8 03 43 01 05 24" -> ['P0524']).
 */
export function parseOBDFrame(rawString: string): ParsedOBDResult {
  const cleaned = cleanELMResponse(rawString);
  const result: ParsedOBDResult = { telemetryUpdates: {} };

  if (cleaned.length === 0) return result;

  // Check for PID 0x00 response (Mode 01 PID 00 -> "4100...")
  if (cleaned.includes('4100') || cleaned.startsWith('4100')) {
    result.isPid00Supported = true;
    return result;
  }

  // Check for Mode 03 / Mode 07 DTC frames (Positive response 0x43 or 0x47)
  let modeIndex = -1;
  if (cleaned.startsWith('43') || cleaned.startsWith('47')) {
    modeIndex = 0;
  } else {
    // E.g. "7E8 03 43 01 05 24" -> cleaned: "7E80343010524"
    const idx43 = cleaned.indexOf('43');
    const idx47 = cleaned.indexOf('47');
    if (idx43 !== -1 && (idx47 === -1 || idx43 < idx47)) {
      modeIndex = idx43;
    } else if (idx47 !== -1) {
      modeIndex = idx47;
    }
  }

  if (modeIndex !== -1) {
    let payload = cleaned.slice(modeIndex + 2);
    // In ISO 15765-4 Mode 03/07, the byte immediately following 43/47 is the DTC count (e.g. 01 for 1 DTC).
    if (payload.length >= 2) {
      const possibleCount = parseInt(payload.slice(0, 2), 16);
      if (possibleCount > 0 && possibleCount <= 16 && (payload.length - 2) >= possibleCount * 4) {
        payload = payload.slice(2);
      }
    }

    const dtcs: string[] = [];
    for (let i = 0; i + 4 <= payload.length; i += 4) {
      const codeBytes = payload.slice(i, i + 4);
      if (codeBytes === '0000') continue;
      const firstByte = parseInt(codeBytes.slice(0, 2), 16);
      const secondByte = codeBytes.slice(2, 4);

      // Decoding first character according to ISO 15765-4 / SAE J1979:
      // 00 -> P0, 01 -> P1, 02 -> P2, 03 -> P3
      // 04 -> C0, 08 -> B0, 0C -> U0
      const prefixCategory = (firstByte & 0xC0) >> 6;
      const prefixCategoryLetter = ['P', 'C', 'B', 'U'][prefixCategory] || 'P';
      const prefixSecondDigit = (firstByte & 0x30) >> 4;
      const remainderHex = (firstByte & 0x0F).toString(16).toUpperCase() + secondByte;
      dtcs.push(`${prefixCategoryLetter}${prefixSecondDigit}${remainderHex}`);
    }
    if (dtcs.length > 0) {
      result.detectedDTCs = dtcs;
      return result;
    }
  }

  // Look for Mode 01 responses: "41XX..."
  const matchIndex = cleaned.indexOf('41');
  if (matchIndex === -1) return result;

  const payload = cleaned.slice(matchIndex + 2);
  if (payload.length < 2) return result;

  const pidHex = payload.slice(0, 2);
  const dataHex = payload.slice(2);

  const getByte = (idx: number): number => {
    const start = idx * 2;
    if (start + 2 > dataHex.length) return 0;
    return parseInt(dataHex.slice(start, start + 2), 16) || 0;
  };

  switch (pidHex) {
    // 0x0D: Vehicle Speed (km/h) -> A
    case '0D': {
      const speed = getByte(0);
      result.telemetryUpdates!.speed = speed;
      break;
    }

    // 0x05: Engine Coolant Temperature (°C) -> A - 40
    case '05': {
      const coolantTemp = getByte(0) - 40;
      result.telemetryUpdates!.coolantTemp = coolantTemp;
      // Many engines share block temp with coolant
      result.telemetryUpdates!.engineTemp = coolantTemp;
      break;
    }

    // 0x5C: Engine Oil Temperature (°C) -> A - 40
    case '5C': {
      const oilTemp = getByte(0) - 40;
      result.telemetryUpdates!.oilTemp = oilTemp;
      break;
    }

    // 0x0C: Engine RPM -> (256 * A + B) / 4
    case '0C': {
      const a = getByte(0);
      const b = getByte(1);
      const rpm = (256 * a + b) / 4;
      result.telemetryUpdates!.rpm = rpm;
      break;
    }

    // 0x0B: Intake Manifold Absolute Pressure (MAP) in kPa -> bar = kPa / 100
    case '0B': {
      const kpa = getByte(0);
      result.telemetryUpdates!.boostGauge = Number((kpa / 100).toFixed(2));
      break;
    }

    // 0x70: Boost Pressure Control
    case '70': {
      const bar = (getByte(0) * 256 + getByte(1)) * 0.03125 - 1.0;
      result.telemetryUpdates!.boostGauge = Number(Math.max(0, bar).toFixed(2));
      break;
    }

    // 0x31: Distance traveled since codes cleared (km) -> 256 * A + B
    case '31': {
      const dist = 256 * getByte(0) + getByte(1);
      result.telemetryUpdates!.totalDistance = dist;
      break;
    }

    // 0xA6: Odometer total distance (km) -> (A << 24) | (B << 16) | (C << 8) | D
    case 'A6': {
      const dist =
        ((getByte(0) << 24) >>> 0) +
        (getByte(1) << 16) +
        (getByte(2) << 8) +
        getByte(3);
      result.telemetryUpdates!.totalDistance = Number((dist / 10).toFixed(1));
      break;
    }

    // 0x5B: Battery State of Charge (SoC %) -> (100 / 255) * A
    case '5B': {
      const soc = Number(((100 / 255) * getByte(0)).toFixed(1));
      result.telemetryUpdates!.batterySoC = soc;
      break;
    }

    // 0x42: Control Module / System Voltage (V) -> (256 * A + B) / 1000
    case '42': {
      const a = getByte(0);
      const b = getByte(1);
      const volts = Number(((256 * a + b) / 1000).toFixed(2));
      result.telemetryUpdates!.systemVoltage = volts;
      break;
    }

    default:
      break;
  }

  return result;
}
