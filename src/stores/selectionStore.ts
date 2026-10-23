import { create } from 'zustand';
import type { Rect } from '../types';

interface SelectionState {
  selectedIds: string[];
  selectionBox: Rect | null;
  hoveredId: string | null;

  // Actions
  select: (id: string, additive?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  selectAll: (allIds: string[]) => void;
  clearSelection: () => void;
  toggleSelection: (id: string) => void;
  setSelectionBox: (rect: Rect | null) => void;
  setHoveredId: (id: string | null) => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  selectionBox: null,
  hoveredId: null,

  select: (id, additive = false) => {
    set((state) => {
      if (additive) {
        if (state.selectedIds.includes(id)) {
          return { selectedIds: state.selectedIds.filter((i) => i !== id) };
        }
        return { selectedIds: [...state.selectedIds, id] };
      }
      return { selectedIds: [id] };
    });
  },

  selectMultiple: (ids) => {
    set({ selectedIds: ids });
  },

  selectAll: (allIds) => {
    set({ selectedIds: allIds });
  },

  clearSelection: () => {
    set({ selectedIds: [], selectionBox: null });
  },

  toggleSelection: (id) => {
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return { selectedIds: state.selectedIds.filter((i) => i !== id) };
      }
      return { selectedIds: [...state.selectedIds, id] };
    });
  },

  setSelectionBox: (rect) => {
    set({ selectionBox: rect });
  },

  setHoveredId: (id) => {
    set({ hoveredId: id });
  },

  isSelected: (id) => {
    return get().selectedIds.includes(id);
  },
}));
