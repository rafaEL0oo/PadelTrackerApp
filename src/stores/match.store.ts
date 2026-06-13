import { create } from 'zustand';
import type { Match, MatchPoint, MatchPlayer, Profile } from '@/types';

interface MatchState {
  match: Match | null;
  players: (MatchPlayer & { profile?: Profile })[];
  points: MatchPoint[];
  isScoring: boolean;
  lastPointAt: number;
  setMatch: (match: Match | null) => void;
  setPlayers: (players: (MatchPlayer & { profile?: Profile })[]) => void;
  setPoints: (points: MatchPoint[]) => void;
  addPoint: (point: MatchPoint) => void;
  updateMatch: (match: Partial<Match>) => void;
  setIsScoring: (isScoring: boolean) => void;
  setLastPointAt: (timestamp: number) => void;
  reset: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  match: null,
  players: [],
  points: [],
  isScoring: false,
  lastPointAt: 0,
  setMatch: (match) => set({ match }),
  setPlayers: (players) => set({ players }),
  setPoints: (points) => set({ points }),
  addPoint: (point) =>
    set((state) => ({ points: [...state.points, point] })),
  updateMatch: (updates) =>
    set((state) => ({
      match: state.match ? { ...state.match, ...updates } : null,
    })),
  setIsScoring: (isScoring) => set({ isScoring }),
  setLastPointAt: (timestamp) => set({ lastPointAt: timestamp }),
  reset: () =>
    set({ match: null, players: [], points: [], isScoring: false, lastPointAt: 0 }),
}));
