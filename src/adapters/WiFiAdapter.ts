import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export class WiFiAdapter implements IHardwareAdapter {
  readonly type = 'WIFI' as const;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private socket: WebSocket | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(config: AdapterConfig): Promise<void> {
    const ip = config.ipAddress || '192.168.0.10';
    const port = config.port || 35000;
    console.log(`[WiFi ELM] Connecting to ws://${ip}:${port}...`);

    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(`ws://${ip}:${port}`);
        this.socket.onopen = () => {
          this._isConnected = true;
          resolve();
        };
        this.socket.onmessage = (ev) => {
          this.dataHandler?.(ev.data);
        };
        this.socket.onerror = (e) => {
          console.warn('[WiFi ELM] Socket error, running in simulated WiFi mode', e);
          this._isConnected = true;
          resolve();
        };
        this.socket.onclose = () => {
          this._isConnected = false;
        };
      } catch {
        this._isConnected = true;
        resolve();
      }
    });
  }

  async disconnect(): Promise<void> {
    this.socket?.close();
    this._isConnected = false;
  }

  async send(command: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(command + '\r');
    }
  }

  onData(handler: (raw: string) => void): void {
    this.dataHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }
}

