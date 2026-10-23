import { create } from 'zustand';
import type { ToolMode, Point, CursorType } from '../types';
import type { ObjectType } from '../types';

interface ToolState {
  mode: ToolMode;
  isDrawing: boolean;
  drawingPoints: Point[];
  rectangleStart: Point | null;
  rectangleEnd: Point | null;
  placingObjectType: ObjectType | null;
  cursor: CursorType;

  // Ruler state
  rulerStart: Point | null;
  rulerEnd: Point | null;
  isRulerActive: boolean;

  // Drag and drop state
  draggingObjectType: ObjectType | null;
  isDragging: boolean;

  // Actions
  setMode: (mode: ToolMode) => void;
  startDrawing: (point: Point) => void;
  addDrawingPoint: (point: Point) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  setPlacingObject: (type: ObjectType | null) => void;
  setCursor: (cursor: CursorType) => void;

  // Rectangle drawing
  startRectangle: (point: Point) => void;
  updateRectangle: (point: Point) => void;
  finishRectangle: () => void;

  // Ruler
  startRuler: (point: Point) => void;
  updateRuler: (point: Point) => void;
  finishRuler: () => void;

  // Drag and drop
  startDragging: (type: ObjectType) => void;
  stopDragging: () => void;
}

export const useToolStore = create<ToolState>((set) => ({
  mode: 'select',
  isDrawing: false,
  drawingPoints: [],
  rectangleStart: null,
  rectangleEnd: null,
  placingObjectType: null,
  cursor: 'default',
  rulerStart: null,
  rulerEnd: null,
  isRulerActive: false,
  draggingObjectType: null,
  isDragging: false,

  setMode: (mode) => {
    set({
      mode,
      isDrawing: false,
      drawingPoints: [],
      rectangleStart: null,
      rectangleEnd: null,
      placingObjectType: null,
      rulerStart: null,
      rulerEnd: null,
      isRulerActive: false,
      cursor: mode === 'pan' ? 'grab' : (mode === 'draw-room' || mode === 'draw-rectangle' || mode === 'ruler') ? 'crosshair' : 'default',
    });
  },

  startDrawing: (point) => {
    set({
      isDrawing: true,
      drawingPoints: [point],
    });
  },

  addDrawingPoint: (point) => {
    set((state) => ({
      drawingPoints: [...state.drawingPoints, point],
    }));
  },

  finishDrawing: () => {
    set({
      isDrawing: false,
      drawingPoints: [],
    });
  },

  cancelDrawing: () => {
    set({
      isDrawing: false,
      drawingPoints: [],
      rectangleStart: null,
      rectangleEnd: null,
    });
  },

  setPlacingObject: (type) => {
    set({
      placingObjectType: type,
      mode: type ? 'select' : 'select',
      cursor: type ? 'crosshair' : 'default',
    });
  },

  setCursor: (cursor) => {
    set({ cursor });
  },

  startRectangle: (point) => {
    set({
      isDrawing: true,
      rectangleStart: point,
      rectangleEnd: point,
    });
  },

  updateRectangle: (point) => {
    set({
      rectangleEnd: point,
    });
  },

  finishRectangle: () => {
    set({
      isDrawing: false,
      rectangleStart: null,
      rectangleEnd: null,
    });
  },

  startRuler: (point) => {
    set({
      isRulerActive: true,
      rulerStart: point,
      rulerEnd: point,
    });
  },

  updateRuler: (point) => {
    set({
      rulerEnd: point,
    });
  },

  finishRuler: () => {
    set({
      isRulerActive: false,
      rulerStart: null,
      rulerEnd: null,
    });
  },

  startDragging: (type) => {
    set({
      isDragging: true,
      draggingObjectType: type,
    });
  },

  stopDragging: () => {
    set({
      isDragging: false,
      draggingObjectType: null,
    });
  },
}));
