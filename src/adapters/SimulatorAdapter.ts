import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export type SimScenario =
  | 'OBD2_NORMAL'
  | 'OBD2_OVERHEAT'
  | 'OBD2_DTC'
  | 'J1939_NORMAL'
  | 'J1939_LIMP'
  | 'J1939_HDV_FULL';

export class SimulatorAdapter implements IHardwareAdapter {
  readonly type = 'SIM_FILE' as const;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private intervalTimer: number | null = null;
  private activeScenario: SimScenario = 'J1939_NORMAL';
  private tickCount = 0;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get scenario(): SimScenario {
    return this.activeScenario;
  }

  async connect(config: AdapterConfig): Promise<void> {
    if (config.scenario) {
      this.activeScenario = config.scenario as SimScenario;
    }
    this._isConnected = true;
    this.startStreaming();
  }

  async disconnect(): Promise<void> {
    this.stopStreaming();
    this._isConnected = false;
  }

  async send(command: string): Promise<void> {
    // If command is OBD2 Mode 01 PID 00, respond immediately
    if (command.includes('0100')) {
      setTimeout(() => {
        this.dataHandler?.('41 00 BE 3E B8 11\r');
      }, 50);
    }
  }

  setScenario(scenario: SimScenario): void {
    this.activeScenario = scenario;
    this.tickCount = 0;
  }

  onData(handler: (raw: string) => void): void {
    this.dataHandler = handler;
  }

  private startStreaming(): void {
    this.stopStreaming();
    // Stream frames at 20 Hz (every 50ms)
    this.intervalTimer = window.setInterval(() => {
      this.tick();
    }, 50);
  }

  private stopStreaming(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private tick(): void {
    if (!this.dataHandler) return;
    this.tickCount++;
    const t = this.tickCount;

    const isHDV = this.activeScenario.startsWith('J1939');

    if (isHDV) {
      this.generateJ1939Frames(t);
    } else {
      this.generateOBD2Frames(t);
    }
  }

  private generateOBD2Frames(t: number): void {
    // 1. Handshake frame periodically: Mode 01 PID 00
    if (t % 40 === 0) {
      this.dataHandler?.('41 00 BE 3E B8 11\r');
    }

    const isOverheat = this.activeScenario === 'OBD2_OVERHEAT';
    const hasDTC = this.activeScenario === 'OBD2_DTC';

    // Speed (PID 0x0D): 45 to 80 km/h
    const speed = Math.round(55 + 15 * Math.sin(t * 0.05));
    this.dataHandler?.(`41 0D ${speed.toString(16).padStart(2, '0')}\r`);

    // RPM (PID 0x0C): 1800 to 2400 RPM
    const rpm = Math.round(2000 + 400 * Math.sin(t * 0.08));
    const rawRpm = Math.round(rpm * 4);
    const rpmA = (rawRpm >> 8) & 0xFF;
    const rpmB = rawRpm & 0xFF;
    this.dataHandler?.(`41 0C ${rpmA.toString(16).padStart(2, '0')} ${rpmB.toString(16).padStart(2, '0')}\r`);

    // Coolant Temp (PID 0x05): normal 88-92°C, or overheat 109-114°C
    const coolant = isOverheat ? 111 + Math.round(3 * Math.sin(t * 0.1)) : 90 + Math.round(2 * Math.sin(t * 0.02));
    const rawCoolant = coolant + 40;
    this.dataHandler?.(`41 05 ${rawCoolant.toString(16).padStart(2, '0')}\r`);

    // Oil Temp (PID 0x5C): 94-98°C
    const oil = isOverheat ? 128 : 96 + Math.round(2 * Math.cos(t * 0.02));
    const rawOil = oil + 40;
    this.dataHandler?.(`41 5C ${rawOil.toString(16).padStart(2, '0')}\r`);

    // Boost (PID 0x0B): MAP 140 kPa (1.4 bar)
    const mapKpa = Math.round(140 + 20 * Math.sin(t * 0.05));
    this.dataHandler?.(`41 0B ${mapKpa.toString(16).padStart(2, '0')}\r`);

    // System Voltage (PID 0x42): 14.1V
    const voltsMilli = 14100 + Math.round(200 * Math.sin(t * 0.03));
    const vA = (voltsMilli >> 8) & 0xFF;
    const vB = voltsMilli & 0xFF;
    this.dataHandler?.(`41 42 ${vA.toString(16).padStart(2, '0')} ${vB.toString(16).padStart(2, '0')}\r`);

    // Battery SoC (PID 0x5B): 92%
    const socByte = Math.round((92 * 255) / 100);
    this.dataHandler?.(`41 5B ${socByte.toString(16).padStart(2, '0')}\r`);

    // Total distance (PID 0x31)
    this.dataHandler?.('41 31 30 A2\r');

    // Injected DTC
    if (hasDTC && t % 20 === 0) {
      // P0524 (05 24) Low oil pressure
      this.dataHandler?.('43 01 05 24 00 00\r');
    }
  }

  private generateJ1939Frames(t: number): void {
    const isLimp = this.activeScenario === 'J1939_LIMP';

    // 1. Electronic Engine Controller 1 (EEC1 - PGN 61444): Engine Speed 1650 RPM
    // SPN 190: bytes 4-5 (0.125 rpm/bit) -> 1650 / 0.125 = 13200 = 0x3390
    const rpm = isLimp ? 1150 : Math.round(1650 + 150 * Math.sin(t * 0.05));
    const rawRpm = Math.round(rpm / 0.125);
    const rpmLow = rawRpm & 0xFF;
    const rpmHigh = (rawRpm >> 8) & 0xFF;
    this.dataHandler?.(
      `0CF00400 F0 7D 82 ${rpmLow.toString(16).padStart(2, '0')} ${rpmHigh.toString(16).padStart(2, '0')} F0 FF FF\r`
    );

    // 2. Cruise Control / Vehicle Speed (CCVS - PGN 65265): Speed 12 to 34 km/h (or 18 km/h in limp)
    const speed = isLimp ? 18.5 : Number((24 + 8 * Math.sin(t * 0.04)).toFixed(1));
    const rawSpeed = Math.round(speed / (1 / 256));
    const spdLow = rawSpeed & 0xFF;
    const spdHigh = (rawSpeed >> 8) & 0xFF;
    this.dataHandler?.(
      `18FEF100 00 ${spdLow.toString(16).padStart(2, '0')} ${spdHigh.toString(16).padStart(2, '0')} FF FF FF FF FF\r`
    );

    // 3. Engine Temp 1 (ET1 - PGN 65262): Coolant 88°C, Oil 92°C
    const coolantRaw = 88 + 40; // 128
    const rawOil = Math.round((92 + 273) / 0.03125); // 11680 = 0x2DA0
    const oilLow = rawOil & 0xFF;
    const oilHigh = (rawOil >> 8) & 0xFF;
    this.dataHandler?.(
      `18FEEE00 ${coolantRaw.toString(16).padStart(2, '0')} FF ${oilLow.toString(16).padStart(2, '0')} ${oilHigh.toString(16).padStart(2, '0')} FF FF FF FF\r`
    );

    // 4. Vehicle Electrical Power 1 (VEP1 - PGN 65271): 28.2V (24V system)
    const rawVolts = Math.round(28.2 / 0.05); // 564 = 0x0234
    const vLow = rawVolts & 0xFF;
    const vHigh = (rawVolts >> 8) & 0xFF;
    this.dataHandler?.(`18FEF700 FF FF FF FF ${vLow.toString(16).padStart(2, '0')} ${vHigh.toString(16).padStart(2, '0')} FF FF\r`);

    // 5. Air Brake Supply Pressure (PGN 65198): Circuit 1 & 2
    // Normal 8.2 bar -> 820 kPa / 8 = 102 (0x66)
    // Limp mode drops Circuit 1 to 4.8 bar -> 480 kPa / 8 = 60 (0x3C)
    const p1Raw = isLimp ? 60 : 102;
    const p2Raw = 104;
    this.dataHandler?.(`18FEAE00 ${p1Raw.toString(16).padStart(2, '0')} ${p2Raw.toString(16).padStart(2, '0')} FF FF FF FF FF FF\r`);

    // 6. Tractor Hydraulics System (PGN 65300)
    // Reservoir level 84%, Reservoir temp 62°C, Pump flow 110 L/min, Pressure 185 bar
    const resLevel = 84;
    const resTemp = 62 + 40; // 102
    const pumpFlow = 110;
    const rawPress = Math.round(185 / 0.1); // 1850 = 0x073A
    const prLow = rawPress & 0xFF;
    const prHigh = (rawPress >> 8) & 0xFF;
    const scv1 = 165; // +65% extend (offset 100)
    this.dataHandler?.(
      `18FF6400 ${resLevel.toString(16).padStart(2, '0')} ${resTemp.toString(16).padStart(2, '0')} ${pumpFlow.toString(16).padStart(2, '0')} ${prLow.toString(16).padStart(2, '0')} ${prHigh.toString(16).padStart(2, '0')} ${scv1.toString(16).padStart(2, '0')} 00 00\r`
    );

    // 7. PTO Information (PGN 65264)
    // Engaged (byte 0 = 0x01), speed 540 RPM -> raw = 540 / 0.125 = 4320 = 0x10E0
    const rawPto = Math.round(540 / 0.125);
    const ptoLow = rawPto & 0xFF;
    const ptoHigh = (rawPto >> 8) & 0xFF;
    this.dataHandler?.(`18FEF000 01 ${ptoLow.toString(16).padStart(2, '0')} ${ptoHigh.toString(16).padStart(2, '0')} FF FF FF FF FF\r`);

    // 8. If J1939_LIMP, broadcast DM1 fault (PGN 65226) with Red Stop Lamp
    if (isLimp && t % 20 === 0) {
      // Byte 0: Red stop lamp active (0x10)
      // SPN 100 (oil pressure) FMI 1 (data valid below normal severe)
      // SPN 100 = 0x00064 -> byte 2: 0x64, byte 3: 0x00, byte 4: 0x01
      this.dataHandler?.('18FECA00 10 FF 64 00 01 01 FF FF\r');
    }
  }
}

