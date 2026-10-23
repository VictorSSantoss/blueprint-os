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
