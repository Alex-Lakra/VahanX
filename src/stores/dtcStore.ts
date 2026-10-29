import { create } from 'zustand';
import { DTCFault } from '../types/telemetry';

interface DTCStore {
  activeFaults: DTCFault[];
  historicFaults: DTCFault[];
  addFaults: (faults: DTCFault[]) => void;
  clearFaults: () => void;
  removeFault: (code: string) => void;
}

export const useDTCStore = create<DTCStore>((set, get) => ({
  activeFaults: [],
  historicFaults: [],

  addFaults: (faults) => {
    const { activeFaults, historicFaults } = get();
    const existingCodes = new Set(activeFaults.map((f) => f.code));
    const newActive = [...activeFaults];

    for (const fault of faults) {
      if (!existingCodes.has(fault.code)) {
        newActive.push(fault);
        existingCodes.add(fault.code);
      }
    }

    set({ activeFaults: newActive, historicFaults: [...historicFaults, ...faults] });
  },

  clearFaults: () => {
    set({ activeFaults: [] });
  },

  removeFault: (code) => {
    const { activeFaults } = get();
    set({ activeFaults: activeFaults.filter((f) => f.code !== code) });
  },
}));

