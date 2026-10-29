import { IHardwareAdapter } from './IHardwareAdapter';
import { AdapterType } from '../types/protocols';
import { BluetoothSPPAdapter } from './BluetoothSPPAdapter';
import { BLEAdapter } from './BLEAdapter';
import { WiFiAdapter } from './WiFiAdapter';
import { USBOTGAdapter } from './USBOTGAdapter';
import { SimulatorAdapter } from './SimulatorAdapter';
import { NetworkSimulatorAdapter } from './NetworkSimulatorAdapter';

export function createAdapter(type: AdapterType): IHardwareAdapter {
  switch (type) {
    case 'BT_SPP':
      return new BluetoothSPPAdapter();
    case 'BLE':
      return new BLEAdapter();
    case 'WIFI':
      return new WiFiAdapter();
    case 'USB':
      return new USBOTGAdapter();
    case 'SIM_FILE':
      return new SimulatorAdapter();
    case 'SIM_NETWORK':
      return new NetworkSimulatorAdapter();
    default:
      return new SimulatorAdapter();
  }
}

