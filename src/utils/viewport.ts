/**
 * Fitting the canvas view to the plan.
 *
 * @remarks
 * Pure functions: the plan is in centimetres, the canvas size and offsets in screen pixels.
 */

import type { Point, Rect, ViewportState } from '../types';
import type { PlanSnapshot } from '../stores/historyStore';
import { FIT_MARGIN_PX, MAX_ZOOM, MIN_ZOOM, PIXELS_PER_CM } from '../constants';

/**
 * Smallest rectangle containing every room, object, dimension line and the lot.
 *
 * @remarks
 * Objects count with half their longer side around their centre, so a rotated object still fits.
 *
 * @param plan - The plan on screen.
 * @returns Bounds in centimetres, or null for an empty plan.
 * @example
 * planBounds({ rooms: [], objects: [], dimensionLines: [], lot: { origin: { x: 0, y: 0 }, width: 1200, depth: 3000, setbacks } })
 * // → { x: 0, y: 0, width: 1200, height: 3000 }
 */
export function planBounds(plan: PlanSnapshot): Rect | null {
  const points: Point[] = [
    ...plan.rooms.flatMap((r) => r.corners.map((c) => c.position)),
    ...plan.dimensionLines.flatMap((d) => [d.start, d.end]),
    ...plan.objects.flatMap(({ position: { x, y }, dimensions }) => {
      const r = Math.max(dimensions.width, dimensions.depth) / 2;
      return [{ x: x - r, y: y - r }, { x: x + r, y: y + r }];
    }),
  ];
  if (plan.lot) {
    const { origin, width, depth } = plan.lot;
    points.push(origin, { x: origin.x + width, y: origin.y + depth });
  }
  if (points.length === 0) return null;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/**
 * The zoom and offset that centre `bounds` in a canvas and make it as large as fits.
 *
 * @param bounds - Area to show, in centimetres.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @returns Viewport with the zoom limited to the allowed range.
 * @example
 * fitViewport({ x: 0, y: 0, width: 500, height: 500 }, 1080, 1080)
 * // → { zoom: 1, offsetX: 40, offsetY: 40 } (500 cm = 1000 px, plus 40 px margins)
 */
export function fitViewport(bounds: Rect, width: number, height: number): ViewportState {
  const fit = Math.min(
    (width - 2 * FIT_MARGIN_PX) / (bounds.width * PIXELS_PER_CM),
    (height - 2 * FIT_MARGIN_PX) / (bounds.height * PIXELS_PER_CM)
  );
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, fit));
  return {
    zoom,
    offsetX: width / 2 - (bounds.x + bounds.width / 2) * PIXELS_PER_CM * zoom,
    offsetY: height / 2 - (bounds.y + bounds.height / 2) * PIXELS_PER_CM * zoom,
  };
}
