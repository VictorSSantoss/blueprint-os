import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeRectRoom } from '../test/factories';
import { useProjectStore } from './projectStore';
import { useHistoryStore } from './historyStore';
import { HISTORY_COALESCE_MS, planChanged, redo, startHistoryRecording, undo } from './history';

let clock = 0;
let stop: () => void;

const advance = (ms: number) => {
  clock += ms;
};
const rooms = () => useProjectStore.getState().rooms;

beforeEach(() => {
  useProjectStore.setState({ rooms: [], objects: [], dimensionLines: [], lot: undefined });
  useHistoryStore.getState().clearHistory();
  clock = 10_000;
  stop = startHistoryRecording(() => clock);
});

afterEach(() => stop());

describe('planChanged', () => {
  it('ignores updates that keep the same plan references', () => {
    const plan = { rooms: [], objects: [], dimensionLines: [] };

    expect(planChanged(plan, { ...plan })).toBe(false);
  });
});

describe('recording and undo', () => {
  it('[FDD-0006 / AC-01] undo restores a deleted room', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    useProjectStore.setState({ rooms: [room] });
    advance(HISTORY_COALESCE_MS);

    useProjectStore.getState().deleteRoom(room.id);
    undo();

    expect(rooms()).toEqual([room]);
  });

  it('[FDD-0006 / AC-02 / INV-01] redo re-applies and returns the same references', () => {
    useProjectStore.getState().addRoom(makeRectRoom(0, 0, 100, 100));
    const after = rooms();

    undo();
    redo();

    expect(rooms()).toBe(after);
  });

  it('[FDD-0006 / AC-03] a shared-wall drag is one step for both rooms', () => {
    const a = makeRectRoom(0, 0, 400, 300);
    const b = makeRectRoom(400, 0, 200, 300);
    useProjectStore.setState({ rooms: [a, b] });
    advance(HISTORY_COALESCE_MS);

    useProjectStore.getState().moveWall(a.id, a.walls[1].id, { dx: 50, dy: 0 });
    undo();

    expect(rooms()).toEqual([a, b]);
  });

  it('[FDD-0006 / AC-04] a burst of changes undoes in one step', () => {
    const room = makeRectRoom(0, 0, 400, 300, { name: 'Cômodo 1' });
    useProjectStore.setState({ rooms: [room] });
    advance(HISTORY_COALESCE_MS);

    for (const name of ['Q', 'Qu', 'Qua', 'Quarto']) {
      useProjectStore.getState().updateRoom(room.id, { name });
      advance(150);
    }
    undo();

    expect(rooms()[0].name).toBe('Cômodo 1');
  });

  it('a pause of the coalescing window starts a new step', () => {
    const room = makeRectRoom(0, 0, 400, 300, { name: 'A' });
    useProjectStore.setState({ rooms: [room] });
    advance(HISTORY_COALESCE_MS);

    useProjectStore.getState().updateRoom(room.id, { name: 'B' });
    advance(HISTORY_COALESCE_MS);
    useProjectStore.getState().updateRoom(room.id, { name: 'C' });
    undo();

    expect(rooms()[0].name).toBe('B');
  });

  it('[FDD-0006 / AC-05] a new change clears redo', () => {
    useProjectStore.getState().addRoom(makeRectRoom(0, 0, 100, 100));
    advance(HISTORY_COALESCE_MS);
    undo();

    useProjectStore.getState().addRoom(makeRectRoom(200, 0, 100, 100));

    expect(useHistoryStore.getState().canRedo).toBe(false);
  });

  it('[FDD-0006 / INV-02] undo and redo do not record themselves', () => {
    useProjectStore.getState().addRoom(makeRectRoom(0, 0, 100, 100));
    advance(HISTORY_COALESCE_MS);
    useProjectStore.getState().addRoom(makeRectRoom(200, 0, 100, 100));

    undo();
    redo();
    undo();
    undo();

    expect(rooms()).toEqual([]);
    expect(useHistoryStore.getState().past).toHaveLength(0);
  });

  it('records lot changes', () => {
    const lot = { origin: { x: 0, y: 0 }, width: 1200, depth: 3000, setbacks: { front: 500, back: 300, left: 150, right: 150 } };

    useProjectStore.getState().setLot(lot);
    undo();

    expect(useProjectStore.getState().lot).toBeUndefined();
  });

  it('does not record a project rename', () => {
    useProjectStore.getState().setProjectName('Casa');

    expect(useHistoryStore.getState().canUndo).toBe(false);
  });
});
