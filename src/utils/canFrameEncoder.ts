export interface RawCanFrame {
  timestamp: number;
  protocol: 'OBD2_ELM327' | 'SAE_J1939';
  canIdHex: string;
  pgnOrPid: string;
  dataLength: number;
  dataBytesHex: string;
  description: string;
  formattedString: string;
}

export interface SimTelemetryInput {
  timestamp?: number;
  vehicleProfile?: 'LMV' | 'HDV';
  engineRpm?: number;
  vehicleSpeedKmh?: number;
  coolantTempC?: number;
  oilTempC?: number;
  boostPressureBar?: number;
  systemVoltageV?: number;
  batterySocPercent?: number;
  distanceTravelledKm?: number;
  throttlePercent?: number;
  brakePercent?: number;
  steeringAngleDeg?: number;
  currentGear?: number;
  lateralGForce?: number;
  longitudinalGForce?: number;
  isFieldDraftActive?: boolean;
  draftSoilResistancePct?: number;
  primaryAirTankBar?: number;
  secondaryAirTankBar?: number;
  ptoEngaged?: boolean;
  ptoActualRpm?: number;
  retarderStage?: number;
  clutchSlipPercent?: number;
  hydraulics?: {
    reservoirFluidLevelPct?: number;
    reservoirFluidTempC?: number;
    pumpVolumetricFlowLpm?: number;
    pumpDischargePressureBar?: number;
    scv1SpoolPositionPct?: number;
  };
  activeDtcs?: Array<{
    code: string;
    spn?: number;
    fmi?: number;
    severity?: string;
  }>;
  limpMode?: {
    active?: boolean;
    clampedSpeedKmh?: number;
  };
}

/**
 * Encodes SimTelemetryInput into a batch of ELM327 (OBD-II ISO 15765-4) ASCII strings
 */
export function encodeObd2Frames(state: SimTelemetryInput): RawCanFrame[] {
  const frames: RawCanFrame[] = [];
  const now = Date.now();

  const toHex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  const toHex4 = (n: number) => Math.max(0, Math.min(65535, Math.round(n))).toString(16).padStart(4, '0').toUpperCase();

  const rpm = state.engineRpm ?? 0;
  const rpmRaw = Math.round(rpm * 4);
  const rpmA = Math.floor(rpmRaw / 256);
  const rpmB = rpmRaw % 256;
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x0C',
    dataLength: 4,
    dataBytesHex: `41 0C ${toHex2(rpmA)} ${toHex2(rpmB)}`,
    description: `Engine Speed: ${rpm.toFixed(0)} RPM`,
    formattedString: `7E8 04 41 0C ${toHex2(rpmA)} ${toHex2(rpmB)}`,
  });

  const speed = state.vehicleSpeedKmh ?? 0;
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x0D',
    dataLength: 3,
    dataBytesHex: `41 0D ${toHex2(speed)}`,
    description: `Vehicle Speed: ${speed.toFixed(1)} km/h`,
    formattedString: `7E8 03 41 0D ${toHex2(speed)}`,
  });

  const coolant = state.coolantTempC ?? 90;
  const coolantRaw = coolant + 40;
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x05',
    dataLength: 3,
    dataBytesHex: `41 05 ${toHex2(coolantRaw)}`,
    description: `Coolant Temp: ${coolant.toFixed(1)} °C`,
    formattedString: `7E8 03 41 05 ${toHex2(coolantRaw)}`,
  });

  const boost = state.boostPressureBar ?? 0;
  const mapKpa = Math.round(boost * 100 + 101);
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x0B',
    dataLength: 3,
    dataBytesHex: `41 0B ${toHex2(mapKpa)}`,
    description: `Intake MAP / Boost: ${boost.toFixed(2)} bar`,
    formattedString: `7E8 03 41 0B ${toHex2(mapKpa)}`,
  });

  const oil = state.oilTempC ?? 95;
  const oilRaw = oil + 40;
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x5C',
    dataLength: 3,
    dataBytesHex: `41 5C ${toHex2(oilRaw)}`,
    description: `Engine Oil Temp: ${oil.toFixed(1)} °C`,
    formattedString: `7E8 03 41 5C ${toHex2(oilRaw)}`,
  });

  const volts = state.systemVoltageV ?? 14.1;
  const voltMv = Math.round(volts * 1000);
  const voltA = Math.floor(voltMv / 256);
  const voltB = voltMv % 256;
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x42',
    dataLength: 4,
    dataBytesHex: `41 42 ${toHex2(voltA)} ${toHex2(voltB)}`,
    description: `System Voltage: ${volts.toFixed(2)} V`,
    formattedString: `7E8 04 41 42 ${toHex2(voltA)} ${toHex2(voltB)}`,
  });

  const soc = state.batterySocPercent ?? 90;
  const socRaw = Math.round((soc * 255) / 100);
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x5B',
    dataLength: 3,
    dataBytesHex: `41 5B ${toHex2(socRaw)}`,
    description: `Battery SoC: ${soc.toFixed(1)} %`,
    formattedString: `7E8 03 41 5B ${toHex2(socRaw)}`,
  });

  const dist = state.distanceTravelledKm ?? 0;
  const distRaw = Math.min(65535, Math.round(dist));
  frames.push({
    timestamp: now,
    protocol: 'OBD2_ELM327',
    canIdHex: '7E8',
    pgnOrPid: 'PID 0x31',
    dataLength: 4,
    dataBytesHex: `41 31 ${toHex4(distRaw).match(/.{1,2}/g)?.join(' ')}`,
    description: `Distance: ${dist.toFixed(0)} km`,
    formattedString: `7E8 04 41 31 ${toHex4(distRaw).match(/.{1,2}/g)?.join(' ')}`,
  });

  if (state.activeDtcs && state.activeDtcs.length > 0) {
    const dtcList = state.activeDtcs.slice(0, 3);
    const dtcBytes = dtcList.map(d => {
      const clean = d.code.replace(/^[PBUC]/, '');
      return clean.length === 4 ? `${clean.substring(0, 2)} ${clean.substring(2, 4)}` : '00 00';
    }).join(' ');
    frames.push({
      timestamp: now,
      protocol: 'OBD2_ELM327',
      canIdHex: '7E8',
      pgnOrPid: 'MODE 03',
      dataLength: dtcList.length * 2 + 1,
      dataBytesHex: `43 ${toHex2(dtcList.length)} ${dtcBytes}`,
      description: `Active Fault Codes: ${dtcList.map(d => d.code).join(', ')}`,
      formattedString: `7E8 ${toHex2(dtcList.length * 2 + 1)} 43 ${toHex2(dtcList.length)} ${dtcBytes}`,
    });
  }

  return frames;
}

/**
 * Encodes SimTelemetryInput into a batch of 29-bit SAE J1939 CAN frames (PGN / SPN)
 */
export function encodeJ1939Frames(state: SimTelemetryInput): RawCanFrame[] {
  const frames: RawCanFrame[] = [];
  const now = Date.now();
  const toHex2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();

  // 1. PGN 61444 (0x0CF00400) EEC1: Engine Speed (SPN 190) & Torque
  const rpm = state.engineRpm ?? 0;
  const rpmBits = Math.round(rpm * 8);
  const rpmLow = rpmBits & 0xFF;
  const rpmHigh = (rpmBits >> 8) & 0xFF;
  const torque = state.throttlePercent ?? 0;
  const torqueByte = Math.round(torque + 125);
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '0CF00400',
    pgnOrPid: 'PGN 61444 (EEC1)',
    dataLength: 8,
    dataBytesHex: `F0 7D ${toHex2(torqueByte)} ${toHex2(rpmLow)} ${toHex2(rpmHigh)} FF FF FF`,
    description: `EEC1: RPM=${rpm.toFixed(0)}, Torque=${torque.toFixed(0)}%`,
    formattedString: `0CF00400 F0 7D ${toHex2(torqueByte)} ${toHex2(rpmLow)} ${toHex2(rpmHigh)} FF FF FF`,
  });

  // 2. PGN 65265 (0x18FEF100) CCVS: Wheel-based Vehicle Speed (SPN 84)
  const speed = state.vehicleSpeedKmh ?? 0;
  const speedBits = Math.round(speed * 256);
  const speedLow = speedBits & 0xFF;
  const speedHigh = (speedBits >> 8) & 0xFF;
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '18FEF100',
    pgnOrPid: 'PGN 65265 (CCVS)',
    dataLength: 8,
    dataBytesHex: `FF ${toHex2(speedLow)} ${toHex2(speedHigh)} FF FF FF FF FF`,
    description: `CCVS: Speed=${speed.toFixed(1)} km/h`,
    formattedString: `18FEF100 FF ${toHex2(speedLow)} ${toHex2(speedHigh)} FF FF FF FF FF`,
  });

  // 3. PGN 65262 (0x18FEEE00) ET1: Engine Coolant Temp (SPN 110) & Oil Temp (SPN 175)
  const coolant = state.coolantTempC ?? 88;
  const oil = state.oilTempC ?? 94;
  const coolantByte = Math.round(coolant + 40);
  const rawOil = Math.round((oil + 273) / 0.03125);
  const oilLow = rawOil & 0xFF;
  const oilHigh = (rawOil >> 8) & 0xFF;
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '18FEEE00',
    pgnOrPid: 'PGN 65262 (ET1)',
    dataLength: 8,
    dataBytesHex: `${toHex2(coolantByte)} FF ${toHex2(oilLow)} ${toHex2(oilHigh)} FF FF FF FF`,
    description: `ET1: Coolant=${coolant.toFixed(1)}°C, Oil=${oil.toFixed(1)}°C`,
    formattedString: `18FEEE00 ${toHex2(coolantByte)} FF ${toHex2(oilLow)} ${toHex2(oilHigh)} FF FF FF FF`,
  });

  // 4. PGN 65198 (0x18FEAE00) AIR1: Air Supply Pressure #1 & #2 (SPN 1087 / 1088)
  const air1 = state.primaryAirTankBar ?? 8.2;
  const air2 = state.secondaryAirTankBar ?? 8.4;
  const air1Bits = Math.round(air1 * 12.5);
  const air2Bits = Math.round(air2 * 12.5);
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '18FEAE00',
    pgnOrPid: 'PGN 65198 (AIR1)',
    dataLength: 8,
    dataBytesHex: `${toHex2(air1Bits)} ${toHex2(air2Bits)} FF FF FF FF FF FF`,
    description: `AIR1: Tank1=${air1.toFixed(1)} bar, Tank2=${air2.toFixed(1)} bar`,
    formattedString: `18FEAE00 ${toHex2(air1Bits)} ${toHex2(air2Bits)} FF FF FF FF FF FF`,
  });

  // 5. PGN 65264 (0x18FEF000) PTO: Power Take-off Speed (SPN 979)
  const ptoSpeed = state.ptoActualRpm ?? 540;
  const ptoBits = Math.round(ptoSpeed * 8);
  const ptoLow = ptoBits & 0xFF;
  const ptoHigh = (ptoBits >> 8) & 0xFF;
  const ptoStatusByte = state.ptoEngaged ? 0x01 : 0x00;
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '18FEF000',
    pgnOrPid: 'PGN 65264 (PTO)',
    dataLength: 8,
    dataBytesHex: `${toHex2(ptoStatusByte)} ${toHex2(ptoLow)} ${toHex2(ptoHigh)} FF FF FF FF FF`,
    description: `PTO: Engaged=${state.ptoEngaged}, Speed=${ptoSpeed.toFixed(0)} RPM`,
    formattedString: `18FEF000 ${toHex2(ptoStatusByte)} ${toHex2(ptoLow)} ${toHex2(ptoHigh)} FF FF FF FF FF`,
  });

  // 6. PGN 61440 (0x18F00010) ERC1: Retarder Selection (SPN 900)
  const retarder = state.retarderStage ?? 0;
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '18F00010',
    pgnOrPid: 'PGN 61440 (ERC1)',
    dataLength: 8,
    dataBytesHex: `${toHex2(retarder)} FF FF FF FF FF FF FF`,
    description: `ERC1: Retarder Stage=${retarder}`,
    formattedString: `18F00010 ${toHex2(retarder)} FF FF FF FF FF FF FF`,
  });

  // 7. PGN 61442 (0x18F00203) ETC1: Current Gear (SPN 522) & AMT Clutch Slip
  const gear = state.currentGear ?? 1;
  const gearByte = gear & 0xFF;
  const clutch = state.clutchSlipPercent ?? 0;
  const clutchByte = Math.round(clutch * 2.5);
  frames.push({
    timestamp: now,
    protocol: 'SAE_J1939',
    canIdHex: '18F00203',
    pgnOrPid: 'PGN 61442 (ETC1)',
    dataLength: 8,
    dataBytesHex: `FF FF FF FF ${toHex2(gearByte)} ${toHex2(clutchByte)} FF FF`,
    description: `ETC1: Gear=${gear}, ClutchSlip=${clutch.toFixed(1)}%`,
    formattedString: `18F00203 FF FF FF FF ${toHex2(gearByte)} ${toHex2(clutchByte)} FF FF`,
  });

  // 8. PGN 65300 (0x18FF6400): Proprietary Tractor Hydraulics
  if (state.hydraulics) {
    const resLevel = Math.round(state.hydraulics.reservoirFluidLevelPct ?? 84);
    const resTemp = Math.round((state.hydraulics.reservoirFluidTempC ?? 62) + 40);
    const flowLpm = Math.min(255, Math.round(state.hydraulics.pumpVolumetricFlowLpm ?? 110));
    const pressRaw = Math.round((state.hydraulics.pumpDischargePressureBar ?? 185) / 0.1);
    const scv1Byte = Math.max(0, Math.min(255, Math.round((state.hydraulics.scv1SpoolPositionPct ?? 0) + 100)));
    frames.push({
      timestamp: now,
      protocol: 'SAE_J1939',
      canIdHex: '18FF6400',
      pgnOrPid: 'PGN 65300 (HYD)',
      dataLength: 8,
      dataBytesHex: `${toHex2(resLevel)} ${toHex2(resTemp)} ${toHex2(flowLpm)} ${toHex2(pressRaw & 0xFF)} ${toHex2((pressRaw >> 8) & 0xFF)} ${toHex2(scv1Byte)} A5 00`,
      description: `HYD: Pressure=${state.hydraulics.pumpDischargePressureBar?.toFixed(0)} bar`,
      formattedString: `18FF6400 ${toHex2(resLevel)} ${toHex2(resTemp)} ${toHex2(flowLpm)} ${toHex2(pressRaw & 0xFF)} ${toHex2((pressRaw >> 8) & 0xFF)} ${toHex2(scv1Byte)} A5 00`,
    });
  }

  // 9. PGN 65226 (0x18FECA00) DM1: Active Diagnostic Trouble Codes
  if (state.activeDtcs && state.activeDtcs.length > 0) {
    const firstDtc = state.activeDtcs[0];
    const spn = firstDtc.spn || 100;
    const fmi = firstDtc.fmi || 1;
    const spnByte1 = spn & 0xFF;
    const spnByte2 = (spn >> 8) & 0xFF;
    const spnByte3 = ((spn >> 16) & 0x07) << 5 | (fmi & 0x1F);
    const redLamp = firstDtc.severity === 'CRITICAL_RED' ? 0x04 : 0x00;
    const amberLamp = firstDtc.severity === 'WARNING_AMBER' ? 0x01 : 0x00;
    frames.push({
      timestamp: now,
      protocol: 'SAE_J1939',
      canIdHex: '18FECA00',
      pgnOrPid: 'PGN 65226 (DM1)',
      dataLength: 8,
      dataBytesHex: `${toHex2(redLamp | amberLamp)} FF ${toHex2(spnByte1)} ${toHex2(spnByte2)} ${toHex2(spnByte3)} 01 FF FF`,
      description: `DM1 Fault: SPN ${spn} FMI ${fmi} (${firstDtc.code})`,
      formattedString: `18FECA00 ${toHex2(redLamp | amberLamp)} FF ${toHex2(spnByte1)} ${toHex2(spnByte2)} ${toHex2(spnByte3)} 01 FF FF`,
    });
  }

  // 10. PGN 0 (0x0C000003) TSC1: Limp Mode Derate command
  if (state.limpMode?.active) {
    const speedLimit = state.limpMode.clampedSpeedKmh ?? 20;
    const speedLimitBits = Math.round(speedLimit * 256);
    const speedLow = speedLimitBits & 0xFF;
    const speedHigh = (speedLimitBits >> 8) & 0xFF;
    frames.push({
      timestamp: now,
      protocol: 'SAE_J1939',
      canIdHex: '0C000003',
      pgnOrPid: 'PGN 0 (TSC1)',
      dataLength: 8,
      dataBytesHex: `01 ${toHex2(speedLow)} ${toHex2(speedHigh)} FF FF FF FF FF`,
      description: `TSC1 Limp Derate: Limit=${speedLimit} km/h`,
      formattedString: `0C000003 01 ${toHex2(speedLow)} ${toHex2(speedHigh)} FF FF FF FF FF`,
    });
  }

  return frames;
}

export function encodeCurrentTelemetryFrames(state: SimTelemetryInput): RawCanFrame[] {
  if (state.vehicleProfile === 'LMV') {
    return encodeObd2Frames(state);
  } else {
    return encodeJ1939Frames(state);
  }
}

