import { create } from 'zustand';
import type { Room, FloorObject, DimensionLine, Lot } from '../types';

/** The undoable part of a project: the plan, not the view (FDD-0006). */
export interface PlanSnapshot {
  rooms: Room[];
  objects: FloorObject[];
  dimensionLines: DimensionLine[];
  lot?: Lot;
}

interface HistoryState {
  past: PlanSnapshot[];
  future: PlanSnapshot[];
  canUndo: boolean;
  canRedo: boolean;

  /** Records the plan as it was before a change, and clears the redo stack. */
  record: (before: PlanSnapshot) => void;
  /**
   * Steps back one change.
   *
   * @param current - The plan as it is now; it becomes the next redo step.
   * @returns The plan to restore, or null when there is nothing to undo.
   */
  undo: (current: PlanSnapshot) => PlanSnapshot | null;
  /**
   * Steps forward one undone change.
   *
   * @param current - The plan as it is now; it becomes the next undo step.
   * @returns The plan to restore, or null when there is nothing to redo.
   */
  redo: (current: PlanSnapshot) => PlanSnapshot | null;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  record: (before) => {
    const past = [...get().past, before].slice(-MAX_HISTORY);
    set({ past, future: [], canUndo: true, canRedo: false });
  },

  undo: (current) => {
    const { past, future } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    set({ past: newPast, future: [current, ...future], canUndo: newPast.length > 0, canRedo: true });
    return previous;
  },

  redo: (current) => {
    const { past, future } = get();
    if (future.length === 0) return null;
    const [next, ...newFuture] = future;
    set({ past: [...past, current], future: newFuture, canUndo: true, canRedo: newFuture.length > 0 });
    return next;
  },

  clearHistory: () => {
    set({ past: [], future: [], canUndo: false, canRedo: false });
  },
}));
