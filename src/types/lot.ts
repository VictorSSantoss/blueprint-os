import type { Point } from './geometry';

/** Rectangular lot (terreno), FDD-0004. All values in whole centimetres; the front (street) is the bottom edge. */
export interface Lot {
  /** Top-left corner. */
  origin: Point;
  /** Frente: length of the front edge. */
  width: number;
  /** Profundidade: distance from front to back. */
  depth: number;
  setbacks: { front: number; back: number; left: number; right: number };
}
