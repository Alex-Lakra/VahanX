import { AdapterType, AdapterConfig } from '../types/protocols';

export interface IHardwareAdapter {
  readonly type: AdapterType;
  readonly isConnected: boolean;
  connect(config: AdapterConfig): Promise<void>;
  disconnect(): Promise<void>;
  send(command: string): Promise<void>;
  onData(handler: (raw: string) => void): void;
  onError?(handler: (err: Error) => void): void;
}

