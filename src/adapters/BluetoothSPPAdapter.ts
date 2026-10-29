import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export class BluetoothSPPAdapter implements IHardwareAdapter {
  readonly type = 'BT_SPP' as const;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(config: AdapterConfig): Promise<void> {
    try {
      console.log(`[BluetoothSPP] Connecting to ${config.deviceName || config.macAddress || 'OBD-II Dongle'}...`);
      // Simulating connection handshake for hybrid runtime
      await new Promise((res) => setTimeout(res, 600));
      this._isConnected = true;
      console.log('[BluetoothSPP] Connected successfully.');
    } catch (err: unknown) {
      this._isConnected = false;
      const error = err instanceof Error ? err : new Error(String(err));
      this.errorHandler?.(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    console.log('[BluetoothSPP] Disconnected.');
  }

  async send(command: string): Promise<void> {
    if (!this._isConnected) throw new Error('Bluetooth SPP not connected');
    console.log(`[BluetoothSPP TX]: ${command}`);
  }

  onData(handler: (raw: string) => void): void {
    this.dataHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }

  /**
   * Internal bridge to deliver incoming serial bytes from Android native plugin
   */
  deliverRaw(raw: string): void {
    this.dataHandler?.(raw);
  }
}

