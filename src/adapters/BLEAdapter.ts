import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export class BLEAdapter implements IHardwareAdapter {
  readonly type = 'BLE' as const;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(config: AdapterConfig): Promise<void> {
    try {
      console.log(`[BLE] Scanning and connecting to GATT service...`);
      await new Promise((res) => setTimeout(res, 500));
      this._isConnected = true;
      console.log('[BLE] Connected to diagnostic characteristic.');
    } catch (err: unknown) {
      this._isConnected = false;
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorHandler?.(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    console.log('[BLE] Disconnected.');
  }

  async send(command: string): Promise<void> {
    if (!this._isConnected) throw new Error('BLE adapter not connected');
    console.log(`[BLE TX]: ${command}`);
  }

  onData(handler: (raw: string) => void): void {
    this.dataHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }

  deliverRaw(raw: string): void {
    this.dataHandler?.(raw);
  }
}

