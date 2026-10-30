import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';

export interface NetworkSimConfig extends AdapterConfig {
  host?: string;
  port?: number;
}

/**
 * Connects to a WebSocket simulator server running on this machine or another laptop on the LAN.
 * Streams real-time simulated CAN bus frames (both OBD-II and J1939).
 * Also integrates with local BroadcastChannel for zero-latency multi-tab pairing.
 */
export class NetworkSimulatorAdapter implements IHardwareAdapter {
  readonly type = 'SIM_NETWORK' as const;
  private socket: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private _isConnected = false;
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private reconnectTimer: number | null = null;
  private lastConfig: NetworkSimConfig | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  private handleIncomingPayload(payload: string) {
    if (!payload || !this.dataHandler) return;
    const clean = payload.trim();
    if (!clean) return;

    // 1. Check for JSON packets from VahanX Wi-Fi Simulator relay
    if (clean.startsWith('{')) {
      try {
        const msg = JSON.parse(clean);

        // Batch of CAN frames
        if (msg.type === 'CAN_FRAME_PACKET' && Array.isArray(msg.frames)) {
          for (const f of msg.frames) {
            if (f && f.rawHex) {
              this.dataHandler(f.rawHex);
            }
          }
          return;
        }

        // Catchup or periodic status packets
        if (msg.type === 'SERVER_HELLO' || msg.type === 'PONG') {
          return;
        }
      } catch (e) {
        // Fall through to plain text parsing
      }
    }

    // 2. Plain ASCII CAN frames (separated by \r or \n)
    const lines = clean.split(/[\r\n]+/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        this.dataHandler(trimmed);
      }
    }
  }

  async connect(config: NetworkSimConfig): Promise<void> {
    this.lastConfig = config;
    const host = config.host || config.ipAddress || '127.0.0.1';
    const port = config.port || 8765;
    const url = `ws://${host}:${port}`;

    console.log(`[NetworkSimulatorAdapter] Connecting to ${url}...`);

    // Setup BroadcastChannel for zero-config local communication
    try {
      if (typeof BroadcastChannel !== 'undefined' && !this.broadcastChannel) {
        this.broadcastChannel = new BroadcastChannel('vahanx_telemetry_bus');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
            this.handleIncomingPayload(dataStr);
          }
        };
        console.log('[NetworkSimulatorAdapter] Local BroadcastChannel paired on vahanx_telemetry_bus');
      }
    } catch (e) {
      console.warn('[NetworkSimulatorAdapter] BroadcastChannel not supported or restricted');
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.socket) {
          this.socket.close();
        }

        this.socket = new WebSocket(url);

        const timeout = setTimeout(() => {
          if (!this._isConnected) {
            // If broadcast channel is active, we can still function locally
            if (this.broadcastChannel) {
              this._isConnected = true;
              console.log(`[NetworkSimulatorAdapter] WebSocket timed out, operating via local BroadcastChannel`);
              resolve();
              return;
            }
            this.socket?.close();
            const err = new Error(`Connection to WebSocket simulator at ${url} timed out`);
            this.errorHandler?.(err);
            reject(err);
          }
        }, 4000);

        this.socket.onopen = () => {
          clearTimeout(timeout);
          this._isConnected = true;
          console.log(`[NetworkSimulatorAdapter] Connected to laptop sim at ${url}`);
          // Register client as DASHBOARD
          this.socket?.send(JSON.stringify({
            type: 'REGISTER',
            clientType: 'DASHBOARD',
            timestamp: Date.now(),
          }));
          resolve();
        };

        this.socket.onmessage = (event) => {
          this.handleIncomingPayload(String(event.data));
        };

        this.socket.onerror = (event) => {
          console.warn('[NetworkSimulatorAdapter] WebSocket error:', event);
          // Don't immediately fail if local BroadcastChannel is running
          if (!this.broadcastChannel) {
            const err = new Error('Network simulator connection error');
            this.errorHandler?.(err);
          }
        };

        this.socket.onclose = () => {
          console.log('[NetworkSimulatorAdapter] WebSocket closed');
          if (!this.broadcastChannel) {
            this._isConnected = false;
          }
        };
      } catch (err: unknown) {
        if (this.broadcastChannel) {
          this._isConnected = true;
          resolve();
          return;
        }
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
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    this._isConnected = false;
  }

  async send(command: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(command);
    }
    if (this.broadcastChannel) {
      try {
        const parsed = JSON.parse(command);
        this.broadcastChannel.postMessage(parsed);
      } catch (e) {
        this.broadcastChannel.postMessage(command);
      }
    }
  }

  setScenario(scenarioName: string): void {
    const payload = JSON.stringify({ type: 'SET_SCENARIO', scenario: scenarioName });
    this.send(payload);
  }

  sendLimpModeReset(): void {
    const payload = JSON.stringify({
      type: 'LIMP_MODE_RESET',
      sender: 'DASHBOARD',
      timestamp: Date.now(),
    });
    this.send(payload);
  }

  sendEcuTune(profileName: string, boostTargetBar: number, rpmGovernorLimit: number): void {
    const payload = JSON.stringify({
      type: 'ECU_TUNE_FLASH',
      sender: 'DASHBOARD',
      profileName,
      boostTargetBar,
      rpmGovernorLimit,
      timestamp: Date.now(),
    });
    this.send(payload);
  }

  onData(handler: (raw: string) => void): void {
    this.dataHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }
}

