import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export class USBOTGAdapter implements IHardwareAdapter {
  readonly type = 'USB' as const;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(config: AdapterConfig): Promise<void> {
    console.log(`[USB-OTG] Connecting to FTDI/CP2102 CAN Interface at baud ${config.baudRate || 500000}...`);
    await new Promise((res) => setTimeout(res, 400));
    this._isConnected = true;
    console.log('[USB-OTG] USB serial bus initialized.');
  }

  async disconnect(): Promise<void> {
    this._isConnected = false;
    console.log('[USB-OTG] Disconnected.');
  }

  async send(command: string): Promise<void> {
    if (!this._isConnected) throw new Error('USB-OTG not connected');
    console.log(`[USB-OTG TX]: ${command}`);
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

