import type { Room } from './rooms';
import type { FloorObject } from './objects';
import type { DimensionLine } from './dimensions';

export type UnitSystem = 'metric' | 'imperial';
export type GridSize = 1 | 5 | 10;

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number; // 0.1 to 4.0
}

export interface ProjectSettings {
  units: UnitSystem;
  gridSize: GridSize;
  showGrid: boolean;
  showDimensions: boolean;
  showObjectLabels: boolean;
  wallThickness: number;
}

export interface Project {
  version: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  viewport: ViewportState;
  rooms: Room[];
  objects: FloorObject[];
  dimensionLines: DimensionLine[];
}

export interface SavedProject {
  project: Project;
  lastSaved: string;
  isAutoSave: boolean;
}
