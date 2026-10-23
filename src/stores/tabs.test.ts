import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { makeRectRoom } from '../test/factories';
import { useProjectStore } from './projectStore';
import { useSelectionStore } from './selectionStore';
import { useTabsStore } from './tabsStore';
import { useHistoryStore } from './historyStore';
import { startHistoryRecording, undo } from './history';
import { closeTab, createTab, currentPlan, duplicateTab, ensureFirstTab, optionsForSave, renameTab, switchTab } from './tabs';

const BASE = 'Opção';
let stop: () => void;
const tabNames = () => useTabsStore.getState().tabs.map((t) => t.name);
const activeName = () => {
  const { tabs, activeTabId } = useTabsStore.getState();
  return tabs.find((t) => t.id === activeTabId)?.name;
};
const idOf = (name: string) => useTabsStore.getState().tabs.find((t) => t.name === name)!.id;

beforeEach(() => {
  useProjectStore.setState({ rooms: [makeRectRoom(0, 0, 400, 300)], objects: [], dimensionLines: [], lot: undefined });
  useTabsStore.setState({ tabs: [], activeTabId: null });
  useHistoryStore.getState().clearHistory();
  stop = startHistoryRecording(() => 0);
  ensureFirstTab(BASE);
});

afterEach(() => stop());

describe('ensureFirstTab', () => {
  it('[FDD-0007 / AC-01 / INV-01] creates Opção 1 around the plan on screen', () => {
    expect(tabNames()).toEqual(['Opção 1']);
    expect(activeName()).toBe('Opção 1');
    expect(useProjectStore.getState().rooms).toHaveLength(1);
  });

  it('drops tabs from the old version that carry no plan', () => {
    useTabsStore.setState({ tabs: [{ id: 'old', name: 'Cômodo' } as never], activeTabId: 'old' });

    ensureFirstTab(BASE);

    expect(tabNames()).toEqual(['Opção 1']);
  });
});

describe('switching options', () => {
  it('[FDD-0007 / AC-02 / INV-02] a duplicate is independent of the original', () => {
    const original = useProjectStore.getState().rooms;
    duplicateTab(BASE);
    const room = useProjectStore.getState().rooms[0];

    useProjectStore.getState().moveCorner(room.id, room.corners[1].id, { x: 500, y: 0 });
    switchTab(idOf('Opção 1'));

    expect(useProjectStore.getState().rooms).toEqual(original);
    switchTab(idOf('Opção 2'));
    expect(useProjectStore.getState().rooms[0].corners[1].position).toEqual({ x: 500, y: 0 });
  });

  it('createTab adds an empty option after the active one', () => {
    createTab(BASE);

    expect(tabNames()).toEqual(['Opção 1', 'Opção 2']);
    expect(useProjectStore.getState().rooms).toEqual([]);
  });

  it('[FDD-0007 / AC-03] switching clears undo history and selection', () => {
    useProjectStore.getState().addRoom(makeRectRoom(500, 0, 100, 100));
    useSelectionStore.getState().select(useProjectStore.getState().rooms[0].id, false);
    createTab(BASE);

    undo();

    expect(useProjectStore.getState().rooms).toEqual([]);
    expect(useHistoryStore.getState().canUndo).toBe(false);
    expect(useSelectionStore.getState().selectedIds).toEqual([]);
  });

  it('the first change after a switch is undoable', () => {
    createTab(BASE);

    useProjectStore.getState().addRoom(makeRectRoom(0, 0, 100, 100));
    undo();

    expect(useProjectStore.getState().rooms).toEqual([]);
  });
});

describe('closing and renaming', () => {
  it('[FDD-0007 / AC-04] the last option cannot be closed', () => {
    closeTab(idOf('Opção 1'));

    expect(tabNames()).toEqual(['Opção 1']);
  });

  it('closing the active option shows its neighbour', () => {
    const plan1 = currentPlan();
    createTab(BASE);

    closeTab(idOf('Opção 2'));

    expect(tabNames()).toEqual(['Opção 1']);
    expect(currentPlan()).toEqual(plan1);
  });

  it('renames, ignoring blank names', () => {
    renameTab(idOf('Opção 1'), '  Cozinha maior ');
    renameTab(idOf('Cozinha maior'), '   ');

    expect(tabNames()).toEqual(['Cozinha maior']);
  });
});

describe('optionsForSave', () => {
  it('includes the active option with its on-screen plan', () => {
    duplicateTab(BASE);
    useProjectStore.getState().addRoom(makeRectRoom(900, 0, 100, 100));

    const { options, activeOption } = optionsForSave();

    expect(options.map((o) => o.name)).toEqual(['Opção 1', 'Opção 2']);
    expect(activeOption).toBe(1);
    expect(options[1].plan.rooms).toHaveLength(2);
    expect(options[0].plan.rooms).toHaveLength(1);
  });
});
