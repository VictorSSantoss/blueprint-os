import type { Point, Line, Rect } from '../types';

export const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
};

export const midpoint = (p1: Point, p2: Point): Point => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

export const angle = (p1: Point, p2: Point): number => {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
};

export const normalizeAngle = (angle: number): number => {
  return ((angle % 360) + 360) % 360;
};

export const snapToAngle = (angle: number, snapDegrees: number): number => {
  return Math.round(angle / snapDegrees) * snapDegrees;
};

export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

export const snapPointToGrid = (point: Point, gridSize: number): Point => {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
};

export const lineLength = (line: Line): number => {
  return distance(line.start, line.end);
};

export const lineIntersection = (line1: Line, line2: Line): Point | null => {
  const { start: p1, end: p2 } = line1;
  const { start: p3, end: p4 } = line2;

  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-10) return null;

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;

  return {
    x: p1.x + ua * (p2.x - p1.x),
    y: p1.y + ua * (p2.y - p1.y),
  };
};

export const pointInRect = (point: Point, rect: Rect): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

export const rectsIntersect = (rect1: Rect, rect2: Rect): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

export const polygonArea = (points: Point[]): number => {
  if (points.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area / 2);
};

export const polygonPerimeter = (points: Point[]): number => {
  if (points.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += distance(points[i], points[j]);
  }
  return perimeter;
};

export const rotatePoint = (point: Point, center: Point, angle: number): Point => {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

export const screenToCanvas = (
  screenX: number,
  screenY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): Point => {
  return {
    x: (screenX - offsetX) / zoom,
    y: (screenY - offsetY) / zoom,
  };
};

export const canvasToScreen = (
  canvasX: number,
  canvasY: number,
  offsetX: number,
  offsetY: number,
  zoom: number
): Point => {
  return {
    x: canvasX * zoom + offsetX,
    y: canvasY * zoom + offsetY,
  };
};
