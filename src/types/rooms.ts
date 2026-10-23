import type { Point } from './geometry';

export interface Corner {
  id: string;
  position: Point;
}

export interface Wall {
  id: string;
  startCornerId: string;
  endCornerId: string;
  thickness: number; // cm, default 15
}

export interface Room {
  id: string;
  name: string;
  corners: Corner[];
  walls: Wall[];
  fillColor: string;
  isComplete: boolean;
  /** Desired area in square centimetres (FDD-0003); absent when no target is set. */
  targetAreaCm2?: number;
}

export interface RoomMetrics {
  area: number; // square cm
  perimeter: number; // cm
  wallLengths: Map<string, number>;
}
