import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PlanSnapshot } from './historyStore';

/**
 * One plan option (FDD-0007).
 *
 * @remarks
 * `plan` is current only for inactive tabs. The active option lives in `projectStore`
 * and is copied back into its tab when the user switches away.
 */
export interface Tab {
  id: string;
  name: string;
  plan: PlanSnapshot;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
}

/** Raw tab state. Change it only through the functions in `stores/tabs.ts`. */
export const useTabsStore = create<TabsState>()(
  persist<TabsState>(() => ({ tabs: [], activeTabId: null }), { name: 'floor-maker-tabs' })
);
