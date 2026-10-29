import { create } from 'zustand';
import { CategoryScore } from '../services/HealthScoreEngine';

interface HealthStore {
  score: number;
  statusBand: 'GREEN' | 'AMBER' | 'RED';
  categories: CategoryScore[];
  hydraulicsScore: number;
  setHealthResult: (score: number, band: 'GREEN' | 'AMBER' | 'RED', categories: CategoryScore[]) => void;
  setHydraulicsScore: (score: number) => void;
}

export const useHealthStore = create<HealthStore>((set) => ({
  score: 96,
  statusBand: 'GREEN',
  categories: [],
  hydraulicsScore: 92,

  setHealthResult: (score, band, categories) => set({ score, statusBand: band, categories }),
  setHydraulicsScore: (hydraulicsScore) => set({ hydraulicsScore }),
}));

