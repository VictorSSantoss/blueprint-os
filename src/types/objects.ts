import type { Point, Angle } from './geometry';

export type ObjectCategory =
  | 'doors'
  | 'windows'
  | 'living-room'
  | 'bedroom'
  | 'dining'
  | 'kitchen'
  | 'bathroom'
  | 'heating'
  | 'structural';

export type ObjectType =
  // Doors
  | 'single-door'
  | 'double-door'
  | 'sliding-door'
  | 'pocket-door'
  | 'french-door'
  // Windows
  | 'standard-window'
  | 'floor-window'
  | 'small-window'
  | 'bay-window'
  // Living Room
  | 'sofa-2'
  | 'sofa-3'
  | 'sofa-l'
  | 'armchair'
  | 'coffee-table'
  | 'tv-stand'
  | 'bookshelf'
  | 'side-table'
  | 'floor-lamp'
  | 'rug-rect'
  // Bedroom
  | 'bed-single'
  | 'bed-double'
  | 'bed-queen'
  | 'bed-king'
  | 'nightstand'
  | 'wardrobe'
  | 'dresser'
  | 'desk'
  | 'office-chair'
  // Dining
  | 'dining-table-4'
  | 'dining-table-6'
  | 'dining-table-8'
  | 'round-table-4'
  | 'dining-chair'
  | 'bar-stool'
  | 'sideboard'
  // Kitchen
  | 'refrigerator'
  | 'dishwasher'
  | 'washing-machine'
  | 'dryer'
  | 'oven'
  | 'cooktop'
  | 'microwave'
  | 'kitchen-sink'
  | 'kitchen-cabinet-base'
  | 'kitchen-cabinet-wall'
  | 'kitchen-island'
  // Bathroom
  | 'toilet'
  | 'bathtub'
  | 'shower-square'
  | 'shower-rect'
  | 'bathroom-sink'
  | 'vanity'
  // Heating
  | 'radiator-small'
  | 'radiator-medium'
  | 'radiator-large'
  | 'radiator-vertical'
  | 'ac-unit'
  | 'standing-fan'
  | 'space-heater'
  // Structural
  | 'void'
  | 'column-square'
  | 'column-round'
  | 'stairs-straight'
  | 'stairs-l'
  | 'stairs-spiral'
  | 'ladder';

export interface ObjectDimensions {
  width: number;  // cm
  depth: number;  // cm
  height: number; // cm
}

export interface ObjectVariant {
  label: string;
  dimensions: ObjectDimensions;
}

export interface ObjectDefinition {
  type: ObjectType;
  category: ObjectCategory;
  name: string;
  defaultDimensions: ObjectDimensions;
  variants: ObjectVariant[];
  snapToWall: boolean;
  icon: string; // SVG path or component name
}

export interface FloorObject {
  id: string;
  type: ObjectType;
  position: Point;
  dimensions: ObjectDimensions;
  rotation: Angle;
  zIndex: number;
  isLocked: boolean;
  customLabel?: string;
  // Door-specific
  doorSwingAngle?: number;
  doorSwingDirection?: 'left' | 'right';
  // Window-specific
  windowSillHeight?: number;
  // Wall attachment
  attachedWallId?: string;
  attachmentOffset?: number;
}
