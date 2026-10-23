import type { Point, Rect } from './geometry';
import type { FloorObject } from './objects';

export type ToolMode =
  | 'select'
  | 'draw-room'
  | 'draw-rectangle'
  | 'place-door'
  | 'place-window'
  | 'dimension'
  | 'ruler'
  | 'pan';

export interface ToolState {
  mode: ToolMode;
  isDrawing: boolean;
  drawingPoints: Point[];
  previewObject?: FloorObject;
}

export interface SelectionState {
  selectedIds: Set<string>;
  selectionBox: Rect | null;
  hoveredId: string | null;
}

export type CursorType = 'default' | 'grab' | 'grabbing' | 'crosshair' | 'move' | 'pointer';

export interface CanvasInteractionState {
  isPanning: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
  dragStartPoint: Point | null;
}
