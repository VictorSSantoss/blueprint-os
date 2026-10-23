import { create } from 'zustand';
import type { Room, FloorObject, DimensionLine } from '../types';

interface ProjectSnapshot {
  timestamp: number;
  rooms: Room[];
  objects: FloorObject[];
  dimensionLines: DimensionLine[];
}

interface HistoryState {
  past: ProjectSnapshot[];
  future: ProjectSnapshot[];
  maxHistory: number;

  // Computed
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  pushState: (snapshot: Omit<ProjectSnapshot, 'timestamp'>) => void;
  undo: () => ProjectSnapshot | null;
  redo: () => ProjectSnapshot | null;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  maxHistory: MAX_HISTORY,
  canUndo: false,
  canRedo: false,

  pushState: (snapshot) => {
    set((state) => {
      const newSnapshot: ProjectSnapshot = {
        ...snapshot,
        timestamp: Date.now(),
      };
      const newPast = [...state.past, newSnapshot].slice(-MAX_HISTORY);
      return {
        past: newPast,
        future: [], // Clear redo stack on new action
        canUndo: newPast.length > 0,
        canRedo: false,
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      canUndo: newPast.length > 0,
      canRedo: true,
    });

    // The current state will be pushed to future by the caller
    return previous;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      future: newFuture,
      canRedo: newFuture.length > 0,
      canUndo: true,
    });

    return next;
  },

  clearHistory: () => {
    set({
      past: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
