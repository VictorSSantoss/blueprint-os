import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room, FloorObject, DimensionLine } from '../types';

export interface Tab {
  id: string;
  name: string;
  rooms: Room[];
  objects: FloorObject[];
  dimensionLines: DimensionLine[];
  createdAt: string;
  updatedAt: string;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;

  // Actions
  createTab: (name?: string) => string;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, data: Partial<Tab>) => void;
  renameTab: (id: string, name: string) => void;
  getActiveTab: () => Tab | null;

  // Sync with project store
  syncTabData: (id: string, rooms: Room[], objects: FloorObject[], dimensionLines: DimensionLine[]) => void;
}

const createNewTab = (name?: string): Tab => ({
  id: uuidv4(),
  name: name || `Room ${Date.now()}`,
  rooms: [],
  objects: [],
  dimensionLines: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      createTab: (name) => {
        const newTab = createNewTab(name);
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
        return newTab.id;
      },

      closeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((tab) => tab.id !== id);
          let newActiveId = state.activeTabId;

          // If closing active tab, switch to another
          if (state.activeTabId === id) {
            const closedIndex = state.tabs.findIndex((t) => t.id === id);
            if (newTabs.length > 0) {
              newActiveId = newTabs[Math.min(closedIndex, newTabs.length - 1)].id;
            } else {
              newActiveId = null;
            }
          }

          return {
            tabs: newTabs,
            activeTabId: newActiveId,
          };
        });
      },

      setActiveTab: (id) => {
        set({ activeTabId: id });
      },

      updateTab: (id, data) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id
              ? { ...tab, ...data, updatedAt: new Date().toISOString() }
              : tab
          ),
        }));
      },

      renameTab: (id, name) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id ? { ...tab, name } : tab
          ),
        }));
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return tabs.find((tab) => tab.id === activeTabId) || null;
      },

      syncTabData: (id, rooms, objects, dimensionLines) => {
        set((state) => ({
          tabs: state.tabs.map((tab) =>
            tab.id === id
              ? { ...tab, rooms, objects, dimensionLines, updatedAt: new Date().toISOString() }
              : tab
          ),
        }));
      },
    }),
    {
      name: 'floor-maker-tabs',
    }
  )
);
