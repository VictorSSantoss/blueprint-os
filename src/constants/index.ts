export * from './objects';

// Grid constants
export const GRID_SIZES = [1, 5, 10] as const;
export const DEFAULT_GRID_SIZE = 10;

// Zoom constants
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4.0;
export const ZOOM_STEP = 0.1;

// Canvas constants
export const PIXELS_PER_CM = 2; // 1cm = 2px at zoom level 1

// Wall constants
export const DEFAULT_WALL_THICKNESS = 15; // cm
export const MIN_WALL_THICKNESS = 5;
export const MAX_WALL_THICKNESS = 50;
export const MIN_WALL_LENGTH = 10; // cm

// Konva node names of draggable room parts. FloorCanvas must not start a
// selection box (which clears the selection) when a press lands on one.
export const ROOM_HANDLE_NAME = 'room-handle';
export const ROOM_WALL_NAME = 'room-wall';

// Konva node name of the lot outline (see ROOM_HANDLE_NAME).
export const LOT_OUTLINE_NAME = 'lot-outline';

/** Starting lot for "Definir terreno" (FDD-0004 Q2): 12 × 30 m, setbacks 5 / 3 / 1,5 / 1,5 m. */
export const DEFAULT_LOT_CM = {
  width: 1200,
  depth: 3000,
  setbacks: { front: 500, back: 300, left: 150, right: 150 },
} as const;

// Angle snapping
export const ANGLE_SNAP_DEGREES = 15;
export const ANGLE_SNAP_TARGETS = [0, 45, 90, 135, 180, 225, 270, 315];

// Colors
export const COLORS = {
  grid: {
    line: '#e5e7eb',
    lineDark: '#374151',
  },
  wall: {
    fill: '#374151',
    stroke: '#1f2937',
    selected: '#3b82f6',
    warning: '#C45C5C',
  },
  lot: {
    outline: '#2C2C2E',
    setback: '#9C9C97',
    buildable: 'rgba(59, 140, 140, 0.06)',
  },
  room: {
    fill: '#f3f4f6',
    fillDark: '#1f2937',
  },
  selection: {
    stroke: '#3b82f6',
    fill: 'rgba(59, 130, 246, 0.1)',
  },
  dimension: {
    line: '#6b7280',
    text: '#374151',
  },
} as const;
