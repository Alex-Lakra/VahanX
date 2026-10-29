import { create } from 'zustand';
import { AdapterType } from '../types/protocols';
import { VehicleType } from '../types/telemetry';
import { IHardwareAdapter } from '../adapters/IHardwareAdapter';
import { createAdapter } from '../adapters/AdapterFactory';
import { RingBuffer } from '../utils/ringBuffer';

interface ConnectionStore {
  adapterType: AdapterType;
  isConnected: boolean;
  isConnecting: boolean;
  vehicleType: VehicleType;
  handshakeStep: string;
  adapterInstance: IHardwareAdapter | null;
  rawFrameSniffer: RingBuffer<string>;
  networkSimHost: string;
  networkSimPort: number;

  setAdapterType: (type: AdapterType) => void;
  setNetworkSimConfig: (host: string, port: number) => void;
  setVehicleType: (type: VehicleType) => void;
  setHandshakeStep: (step: string) => void;
  connect: (scenario?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  pushRawFrame: (frame: string) => void;
}

export const useConnectionStore = create<ConnectionStore>((set, get) => ({
  adapterType: 'SIM_FILE',
  isConnected: false,
  isConnecting: false,
  vehicleType: 'HDV', // Default to HDV for full tractor demo, can be switched or auto-detected
  handshakeStep: 'Ready to connect',
  adapterInstance: null,
  rawFrameSniffer: new RingBuffer<string>(50),
  networkSimHost: '192.168.1.50',
  networkSimPort: 8765,

  setAdapterType: (type) => set({ adapterType: type }),
  setNetworkSimConfig: (host, port) => set({ networkSimHost: host, networkSimPort: port }),
  setVehicleType: (type) => set({ vehicleType: type }),
  setHandshakeStep: (step) => set({ handshakeStep: step }),

  connect: async (scenario) => {
    const { adapterType, networkSimHost, networkSimPort } = get();
    set({ isConnecting: true, handshakeStep: 'Initiating physical bus connection...' });

    try {
      const adapter = createAdapter(adapterType);
      await adapter.connect({
        type: adapterType,
        ipAddress: networkSimHost,
        port: networkSimPort,
        scenario: scenario || 'J1939_NORMAL',
      });

      set({
        adapterInstance: adapter,
        isConnected: true,
        isConnecting: false,
        handshakeStep: 'Connected. Running 3-second protocol handshake...',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      set({
        isConnected: false,
        isConnecting: false,
        handshakeStep: `Connection failed: ${msg}`,
      });
      throw err;
    }
  },

  disconnect: async () => {
    const { adapterInstance } = get();
    if (adapterInstance) {
      await adapterInstance.disconnect();
    }
    set({
      adapterInstance: null,
      isConnected: false,
      isConnecting: false,
      handshakeStep: 'Disconnected',
    });
  },

  pushRawFrame: (frame) => {
    const { rawFrameSniffer } = get();
    rawFrameSniffer.push(frame);
  },
}));
