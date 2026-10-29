import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export interface NetworkSimConfig extends AdapterConfig {
  host?: string;
  port?: number;
}

/**
 * Connects to a WebSocket simulator server running on another laptop on the LAN.
 * Streams real-time simulated CAN bus frames (both OBD-II and J1939).
 */
export class NetworkSimulatorAdapter implements IHardwareAdapter {
  readonly type = 'SIM_NETWORK' as const;
  private socket: WebSocket | null = null;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private reconnectTimer: number | null = null;
  private lastConfig: NetworkSimConfig | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(config: NetworkSimConfig): Promise<void> {
    this.lastConfig = config;
    const host = config.host || config.ipAddress || '127.0.0.1';
    const port = config.port || 8765;
    const url = `ws://${host}:${port}`;

    console.log(`[NetworkSimulatorAdapter] Connecting to ${url}...`);

    return new Promise((resolve, reject) => {
      try {
        if (this.socket) {
          this.socket.close();
        }

        this.socket = new WebSocket(url);

        const timeout = setTimeout(() => {
          if (!this._isConnected) {
            this.socket?.close();
            const err = new Error(`Connection to WebSocket simulator at ${url} timed out`);
            this.errorHandler?.(err);
            reject(err);
          }
        }, 5000);

        this.socket.onopen = () => {
          clearTimeout(timeout);
          this._isConnected = true;
          console.log(`[NetworkSimulatorAdapter] Connected to laptop sim at ${url}`);
          resolve();
        };

        this.socket.onmessage = (event) => {
          const raw = String(event.data);
          this.dataHandler?.(raw);
        };

        this.socket.onerror = (event) => {
          console.warn('[NetworkSimulatorAdapter] WebSocket error:', event);
          const err = new Error('Network simulator connection error');
          this.errorHandler?.(err);
        };

        this.socket.onclose = () => {
          this._isConnected = false;
          console.log('[NetworkSimulatorAdapter] Connection closed');
        };
      } catch (err: unknown) {
        this._isConnected = false;
        const error = err instanceof Error ? err : new Error(String(err));
        reject(error);
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this._isConnected = false;
  }

  async send(command: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(command);
    } else {
      console.warn('[NetworkSimulatorAdapter] Cannot send, socket not open');
    }
  }

  setScenario(scenarioName: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'SET_SCENARIO', scenario: scenarioName }));
    }
  }

  onData(handler: (raw: string) => void): void {
    this.dataHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }
}

