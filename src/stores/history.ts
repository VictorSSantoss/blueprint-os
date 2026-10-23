/**
 * Undo/redo wiring — FDD-0006.
 *
 * @remarks
 * Instead of every store action pushing history, one subscriber watches the plan and
 * records the state from before each change. Project state is immutable, so comparing
 * the four plan references is enough to detect a change.
 */

import { useProjectStore } from './projectStore';
import { useHistoryStore, type PlanSnapshot } from './historyStore';

/**
 * Changes closer together than this join one undo step, so typing a name or resizing an
 * object (both write on every keystroke or mouse move) undoes in one go.
 */
export const HISTORY_COALESCE_MS = 500;

let isRestoring = false;
let lastChangeAt = Number.NEGATIVE_INFINITY;

function snapshotOf(state: PlanSnapshot): PlanSnapshot {
  return { rooms: state.rooms, objects: state.objects, dimensionLines: state.dimensionLines, lot: state.lot };
}

/**
 * True when any part of the plan is a different reference.
 *
 * @param a - Plan after a store update.
 * @param b - Plan before it.
 * @returns False for updates that only touched the project name or other non-plan fields.
 */
export function planChanged(a: PlanSnapshot, b: PlanSnapshot): boolean {
  return a.rooms !== b.rooms || a.objects !== b.objects || a.dimensionLines !== b.dimensionLines || a.lot !== b.lot;
}

/**
 * Starts recording plan changes into the history store.
 *
 * @remarks
 * A change starts a new undo step only when the previous change was at least
 * {@link HISTORY_COALESCE_MS} ago; within a continuous burst only the state before the
 * burst is kept.
 *
 * @param now - Clock in milliseconds; injectable for tests.
 * @returns A function that stops recording.
 */
export function startHistoryRecording(now: () => number = Date.now): () => void {
  lastChangeAt = Number.NEGATIVE_INFINITY;
  return useProjectStore.subscribe((state, prev) => {
    if (isRestoring || !planChanged(state, prev)) return;
    const t = now();
    const startsNewStep = t - lastChangeAt >= HISTORY_COALESCE_MS;
    lastChangeAt = t;
    if (startsNewStep) useHistoryStore.getState().record(snapshotOf(prev));
  });
}

function restore(snapshot: PlanSnapshot): void {
  isRestoring = true;
  try {
    useProjectStore.setState(snapshot);
  } finally {
    isRestoring = false;
  }
  lastChangeAt = Number.NEGATIVE_INFINITY;
}

/** Reverts the plan to before the last undo step. Does nothing when there is none. */
export function undo(): void {
  const previous = useHistoryStore.getState().undo(snapshotOf(useProjectStore.getState()));
  if (previous) restore(previous);
}

/** Re-applies the last undone step. Does nothing when there is none. */
export function redo(): void {
  const next = useHistoryStore.getState().redo(snapshotOf(useProjectStore.getState()));
  if (next) restore(next);
}
