import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterConfig } from '../types/protocols';
import { encodeCurrentTelemetryFrames, SimTelemetryInput } from '../utils/canFrameEncoder';
import { useConnectionStore } from '../stores/connectionStore';

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
  private _transport: 'WEBSOCKET' | 'BROADCAST_CHANNEL' | 'DISCONNECTED' = 'DISCONNECTED';
  private dataHandler: ((raw: string) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private reconnectTimer: number | null = null;
  private lastConfig: NetworkSimConfig | null = null;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get transport(): 'WEBSOCKET' | 'BROADCAST_CHANNEL' | 'DISCONNECTED' {
    return this._transport;
  }

  private handleIncomingPayload(payload: string) {
    if (!payload || !this.dataHandler) return;
    const clean = payload.trim();
    if (!clean) return;

    // 1. Check for JSON packets from VahanX Wi-Fi Simulator relay
    if (clean.startsWith('{')) {
      try {
        const msg = JSON.parse(clean);

        // A. Direct Telemetry Packet from VahanX Simulator (format: NORMALIZED_JSON)
        if (msg.type === 'TELEMETRY_PACKET' && msg.data) {
          const telemetryData = msg.data as SimTelemetryInput;
          const frames = encodeCurrentTelemetryFrames(telemetryData);
          for (const f of frames) {
            this.dataHandler(f.formattedString);
          }
          if (telemetryData.vehicleProfile) {
            useConnectionStore.getState().setVehicleType(telemetryData.vehicleProfile);
          }
          return;
        }

        // B. Catchup or replay packet on initial connect
        if (msg.type === 'TELEMETRY_CATCHUP') {
          const telemetryData = (msg.data?.data || msg.data) as SimTelemetryInput;
          if (telemetryData) {
            const frames = encodeCurrentTelemetryFrames(telemetryData);
            for (const f of frames) {
              this.dataHandler(f.formattedString);
            }
          }
          return;
        }

        // C. Batch of CAN frames (format: RAW_CAN_HEX)
        if (msg.type === 'CAN_FRAME_PACKET' && Array.isArray(msg.frames)) {
          for (const f of msg.frames) {
            if (f && f.rawHex) {
              this.dataHandler(f.rawHex);
            }
          }
          return;
        }

        // D. Vehicle Profile Handshake
        if ((msg.type === 'HANDSHAKE_INIT' || msg.type === 'VEHICLE_PROFILE_CHANGE') && msg.vehicleProfile) {
          useConnectionStore.getState().setVehicleType(msg.vehicleProfile);
          return;
        }

        // E. Server Hello & status packets
        if (msg.type === 'SERVER_HELLO') {
          if (msg.lastKnownVehicleProfile) {
            useConnectionStore.getState().setVehicleType(msg.lastKnownVehicleProfile);
          }
          return;
        }

        if (msg.type === 'PONG') {
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
    const isLocal = host === '127.0.0.1' || host === 'localhost' || host === '::1';

    console.log(`[NetworkSimulatorAdapter] Connecting to ${url} (isLocal=${isLocal})...`);

    // Setup BroadcastChannel for zero-config local communication across tabs on same machine
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
      let resolved = false;

      const tryConnectWebSocket = (targetUrl: string, fallbackUrl?: string) => {
        try {
          if (this.socket) {
            this.socket.close();
            this.socket = null;
          }

          const ws = new WebSocket(targetUrl);
          this.socket = ws;

          const timeout = setTimeout(() => {
            if (!this._isConnected) {
              if (fallbackUrl) {
                console.warn(`[NetworkSimulatorAdapter] Failed ${targetUrl}, trying fallback ${fallbackUrl}...`);
                tryConnectWebSocket(fallbackUrl);
                return;
              }
              // If local on same laptop, fall back to BroadcastChannel
              if (isLocal && this.broadcastChannel) {
                this._isConnected = true;
                this._transport = 'BROADCAST_CHANNEL';
                console.log(`[NetworkSimulatorAdapter] Local WebSocket timed out, operating via BroadcastChannel`);
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
                return;
              }
              this.socket?.close();
              const err = new Error(`Connection to WebSocket simulator at ${url} timed out. Verify the simulator laptop IP and ensure wsRelay (port ${port}) is running.`);
              this.errorHandler?.(err);
              if (!resolved) {
                resolved = true;
                reject(err);
              }
            }
          }, 4000);

          ws.onopen = () => {
            clearTimeout(timeout);
            this._isConnected = true;
            this._transport = 'WEBSOCKET';
            console.log(`[NetworkSimulatorAdapter] Connected via Wi-Fi WebSocket at ${targetUrl}`);
            // Register client as DASHBOARD
            ws.send(JSON.stringify({
              type: 'REGISTER',
              clientType: 'DASHBOARD',
              timestamp: Date.now(),
            }));
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          ws.onmessage = (event) => {
            this.handleIncomingPayload(String(event.data));
          };

          ws.onerror = (event) => {
            console.warn('[NetworkSimulatorAdapter] WebSocket error on', targetUrl, event);
            if (fallbackUrl && !this._isConnected) {
              clearTimeout(timeout);
              console.log(`[NetworkSimulatorAdapter] WebSocket error, trying fallback to ${fallbackUrl}...`);
              tryConnectWebSocket(fallbackUrl);
              return;
            }
            if (!isLocal && !this._isConnected) {
              const err = new Error(`Cannot reach WebSocket simulator at ${targetUrl}. Ensure the host laptop is on the same Wi-Fi network.`);
              this.errorHandler?.(err);
            }
          };

          ws.onclose = () => {
            console.log('[NetworkSimulatorAdapter] WebSocket closed');
            if (!isLocal || !this.broadcastChannel) {
              this._isConnected = false;
              this._transport = 'DISCONNECTED';
            }
          };
        } catch (err: unknown) {
          if (fallbackUrl && !this._isConnected) {
            tryConnectWebSocket(fallbackUrl);
            return;
          }
          if (isLocal && this.broadcastChannel) {
            this._isConnected = true;
            this._transport = 'BROADCAST_CHANNEL';
            if (!resolved) {
              resolved = true;
              resolve();
            }
            return;
          }
          this._isConnected = false;
          this._transport = 'DISCONNECTED';
          const error = err instanceof Error ? err : new Error(String(err));
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        }
      };

      // If user passed port 8080 (common confusion with Vite web port), provide fallback to 8765
      const fallback = port === 8080 ? `ws://${host}:8765` : (port !== 8765 && isLocal ? `ws://${host}:8765` : undefined);
      tryConnectWebSocket(url, fallback);
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
    this._transport = 'DISCONNECTED';
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

