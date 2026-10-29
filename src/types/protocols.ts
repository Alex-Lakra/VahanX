import { CoreTelemetryState, HDVTelemetryState, HydraulicTelemetryState, DTCFault } from './telemetry';
export { type VehicleType } from './telemetry';

export type AdapterType =
  | 'BT_SPP'
  | 'BLE'
  | 'WIFI'
  | 'USB'
  | 'SIM_FILE'
  | 'SIM_NETWORK';

export interface AdapterConfig {
  type: AdapterType;
  deviceName?: string;
  macAddress?: string;
  ipAddress?: string;
  port?: number;
  baudRate?: number;
  scenario?: string;
}

export interface IHardwareAdapter {
  readonly type: AdapterType;
  readonly isConnected: boolean;
  connect(config: AdapterConfig): Promise<void>;
  disconnect(): Promise<void>;
  send(command: string): Promise<void>;
  onData(handler: (raw: string) => void): void;
  onError?(handler: (err: Error) => void): void;
}

// Web Worker message contracts
export type WorkerInboundMsg =
  | { type: 'RAW_FRAME'; payload: string }
  | { type: 'SET_PROTOCOL'; payload: 'OBD2' | 'J1939' }
  | { type: 'RESET' }
  | { type: 'INJECT_SIM_DATA'; payload: Partial<Record<keyof CoreTelemetryState, number>> };

export type WorkerOutboundMsg =
  | { type: 'TELEMETRY_UPDATE'; payload: Partial<Record<keyof CoreTelemetryState, number>> }
  | { type: 'HDV_UPDATE'; payload: Partial<HDVTelemetryState> }
  | { type: 'HYDRAULIC_UPDATE'; payload: Partial<HydraulicTelemetryState> }
  | { type: 'DTC_DETECTED'; payload: DTCFault[] }
  | { type: 'VEHICLE_TYPE_RESOLVED'; payload: 'LMV' | 'HDV' }
  | { type: 'RAW_SNIFF'; payload: string }
  | { type: 'PARSE_ERROR'; payload: string };
