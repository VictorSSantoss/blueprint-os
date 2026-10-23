export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  dx: number;
  dy: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export type Angle = number; // degrees, 0-360
