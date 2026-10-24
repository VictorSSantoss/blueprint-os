/**
 * Plan options in tabs — FDD-0007.
 *
 * @remarks
 * The active option lives in `projectStore`, where every feature and the undo recorder
 * read it. Inactive options live in `tabsStore`. Every operation that changes which plan
 * is on screen goes through `loadPlan`, so the swap, the selection reset and the undo
 * reset always happen together.
 */

import { v4 as uuidv4 } from 'uuid';
import { useProjectStore } from './projectStore';
import { useSelectionStore } from './selectionStore';
import { useTabsStore, type Tab } from './tabsStore';
import { useCanvasStore } from './canvasStore';
import { useCanvasRefStore } from './canvasRefStore';
import type { PlanSnapshot } from './historyStore';
import { resetHistory } from './history';
import { nextRoomName } from '../utils/programme';
import { fitViewport, planBounds } from '../utils/viewport';

const emptyPlan = (): PlanSnapshot => ({ rooms: [], objects: [], dimensionLines: [], lot: undefined });

/** The plan currently on screen. */
export function currentPlan(): PlanSnapshot {
  const { rooms, objects, dimensionLines, lot } = useProjectStore.getState();
  return { rooms, objects, dimensionLines, lot };
}

/**
 * True when the plan has nothing in it.
 *
 * @param plan - Any option's plan.
 * @returns False if it has rooms, objects, dimension lines or a lot.
 */
export function isPlanEmpty(plan: PlanSnapshot): boolean {
  return plan.rooms.length === 0 && plan.objects.length === 0 && plan.dimensionLines.length === 0 && !plan.lot;
}

function loadPlan(plan: PlanSnapshot): void {
  useProjectStore.setState(plan);
  useSelectionStore.getState().clearSelection();
  resetHistory();
}

/** Tabs with the active one's plan refreshed from the screen. */
function tabsWithCurrentPlan(): Tab[] {
  const { tabs, activeTabId } = useTabsStore.getState();
  return tabs.map((t) => (t.id === activeTabId ? { ...t, plan: currentPlan() } : t));
}

/**
 * Guarantees a valid active tab at startup.
 *
 * @remarks
 * Tabs saved by the old version carry no `plan` and are dropped. When no valid active tab
 * remains, a new option is created around the plan already on screen, so nothing is lost.
 *
 * @param base - Localised base name, e.g. `Opção`.
 */
export function ensureFirstTab(base: string): void {
  const { tabs, activeTabId } = useTabsStore.getState();
  const valid = tabs.filter((t) => t.plan && Array.isArray(t.plan.rooms));
  if (valid.some((t) => t.id === activeTabId)) {
    if (valid.length !== tabs.length) useTabsStore.setState({ tabs: valid });
    return;
  }
  const tab: Tab = { id: uuidv4(), name: nextRoomName(valid, base), plan: currentPlan() };
  useTabsStore.setState({ tabs: [...valid, tab], activeTabId: tab.id });
}

/**
 * Shows another option.
 *
 * @param id - Tab to activate.
 */
export function switchTab(id: string): void {
  const { tabs, activeTabId } = useTabsStore.getState();
  const target = tabs.find((t) => t.id === id);
  if (!target || id === activeTabId) return;
  useTabsStore.setState({ tabs: tabsWithCurrentPlan(), activeTabId: id });
  loadPlan(target.plan);
}

function addAndSwitch(tab: Tab): void {
  const { tabs, activeTabId } = useTabsStore.getState();
  const at = tabs.findIndex((t) => t.id === activeTabId) + 1;
  const updated = tabsWithCurrentPlan();
  updated.splice(at, 0, tab);
  useTabsStore.setState({ tabs: updated, activeTabId: tab.id });
  loadPlan(tab.plan);
}

/**
 * Adds an empty option after the active one and shows it.
 *
 * @param base - Localised base name, e.g. `Opção`.
 */
export function createTab(base: string): void {
  addAndSwitch({ id: uuidv4(), name: nextRoomName(useTabsStore.getState().tabs, base), plan: emptyPlan() });
}

/**
 * Copies the active option into a new tab after it and shows the copy.
 *
 * @remarks
 * The copy is deep, so editing one option can never change the other (FDD-0007 INV-02).
 *
 * @param base - Localised base name, e.g. `Opção`.
 */
export function duplicateTab(base: string): void {
  addAndSwitch({
    id: uuidv4(),
    name: nextRoomName(useTabsStore.getState().tabs, base),
    plan: structuredClone(currentPlan()),
  });
}

/**
 * Removes an option. The last option cannot be removed.
 *
 * @param id - Tab to close; when it is the active one, the neighbouring tab is shown first.
 */
export function closeTab(id: string): void {
  const { tabs, activeTabId } = useTabsStore.getState();
  if (tabs.length <= 1) return;
  const index = tabs.findIndex((t) => t.id === id);
  if (index === -1) return;
  if (id === activeTabId) switchTab((tabs[index + 1] ?? tabs[index - 1]).id);
  useTabsStore.setState({ tabs: useTabsStore.getState().tabs.filter((t) => t.id !== id) });
}

/**
 * Renames an option.
 *
 * @param id - Tab to rename.
 * @param name - New name; ignored when blank.
 */
export function renameTab(id: string, name: string): void {
  if (!name.trim()) return;
  useTabsStore.setState({
    tabs: useTabsStore.getState().tabs.map((t) => (t.id === id ? { ...t, name: name.trim() } : t)),
  });
}

/**
 * All options as they should be written to a project file.
 *
 * @returns Options in tab order (the active one with its on-screen plan) and the active index.
 */
export function optionsForSave(): { options: { name: string; plan: PlanSnapshot }[]; activeOption: number } {
  const { activeTabId } = useTabsStore.getState();
  const tabs = tabsWithCurrentPlan();
  return {
    options: tabs.map(({ name, plan }) => ({ name, plan })),
    activeOption: Math.max(0, tabs.findIndex((t) => t.id === activeTabId)),
  };
}

/**
 * Zooms and pans so the whole plan on screen, lot included, is visible and centred.
 *
 * @remarks
 * An empty plan resets the view. Does nothing before the canvas exists, e.g. at startup,
 * where the saved view is kept.
 */
export function fitViewToPlan(): void {
  const stage = useCanvasRefStore.getState().stageRef;
  if (!stage) return;
  const bounds = planBounds(currentPlan());
  if (!bounds) return useCanvasStore.getState().resetView();
  useCanvasStore.setState({ viewport: fitViewport(bounds, stage.width(), stage.height()) });
}

/**
 * Replaces every option, as when opening a file or starting a new project.
 *
 * @param options - At least one option.
 * @param activeOption - Index of the option to show.
 */
export function replaceAllTabs(options: { name: string; plan: PlanSnapshot }[], activeOption: number): void {
  const tabs = options.map((o) => ({ id: uuidv4(), name: o.name, plan: o.plan }));
  useTabsStore.setState({ tabs, activeTabId: tabs[activeOption].id });
  loadPlan(tabs[activeOption].plan);
  fitViewToPlan();
}
