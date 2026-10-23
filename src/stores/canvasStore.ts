import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewportState, GridSize, Point } from '../types';

interface CanvasState {
  viewport: ViewportState;
  gridSize: GridSize;
  showGrid: boolean;
  showDimensions: boolean;
  showObjectLabels: boolean;
  isExporting: boolean;

  // Actions
  setZoom: (zoom: number, centerX?: number, centerY?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  pan: (deltaX: number, deltaY: number) => void;
  setOffset: (offsetX: number, offsetY: number) => void;
  resetView: () => void;
  setGridSize: (size: GridSize) => void;
  toggleGrid: () => void;
  toggleDimensions: () => void;
  toggleObjectLabels: () => void;
  setExporting: (isExporting: boolean) => void;

  // Transient snap indicator — not persisted
  snapHighlightPoint: Point | null;
  setSnapHighlightPoint: (point: Point | null) => void;
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;

export const useCanvasStore = create<CanvasState>()(
  persist(
    (set, get) => ({
  viewport: {
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
  },
  gridSize: 10,
  showGrid: true,
  showDimensions: true,
  showObjectLabels: true,
  isExporting: false,
  snapHighlightPoint: null,

  setZoom: (zoom, centerX, centerY) => {
    const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
    const { viewport } = get();

    if (centerX !== undefined && centerY !== undefined) {
      // Zoom towards the center point
      const scale = clampedZoom / viewport.zoom;
      const newOffsetX = centerX - (centerX - viewport.offsetX) * scale;
      const newOffsetY = centerY - (centerY - viewport.offsetY) * scale;

      set({
        viewport: {
          zoom: clampedZoom,
          offsetX: newOffsetX,
          offsetY: newOffsetY,
        },
      });
    } else {
      set({
        viewport: {
          ...viewport,
          zoom: clampedZoom,
        },
      });
    }
  },

  zoomIn: () => {
    const { viewport, setZoom } = get();
    setZoom(viewport.zoom + ZOOM_STEP);
  },

  zoomOut: () => {
    const { viewport, setZoom } = get();
    setZoom(viewport.zoom - ZOOM_STEP);
  },

  pan: (deltaX, deltaY) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        offsetX: state.viewport.offsetX + deltaX,
        offsetY: state.viewport.offsetY + deltaY,
      },
    }));
  },

  setOffset: (offsetX, offsetY) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        offsetX,
        offsetY,
      },
    }));
  },

  resetView: () => {
    set({
      viewport: {
        offsetX: 0,
        offsetY: 0,
        zoom: 1,
      },
    });
  },

  setGridSize: (size) => {
    set({ gridSize: size });
  },

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleDimensions: () => {
    set((state) => ({ showDimensions: !state.showDimensions }));
  },

  toggleObjectLabels: () => {
    set((state) => ({ showObjectLabels: !state.showObjectLabels }));
  },

  setExporting: (isExporting) => {
    set({ isExporting });
  },

  setSnapHighlightPoint: (point) => {
    set({ snapHighlightPoint: point });
  },
    }),
    {
      name: 'floor-maker-canvas',
      partialize: (state) => ({
        gridSize: state.gridSize,
        showGrid: state.showGrid,
        showDimensions: state.showDimensions,
        showObjectLabels: state.showObjectLabels,
      }),
    }
  )
);
