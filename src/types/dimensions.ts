import type { Point } from './geometry';

export type DimensionType = 'auto' | 'manual';

export interface DimensionLine {
  id: string;
  type: DimensionType;
  start: Point;
  end: Point;
  offset: number;
  labelOverride?: string;
  isVisible: boolean;
}

export interface AutoDimension extends DimensionLine {
  type: 'auto';
  attachedToId: string;
  side: 'top' | 'right' | 'bottom' | 'left';
}
