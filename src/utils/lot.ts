/**
 * Lot (terreno) and setback (recuo) utilities — FDD-0004.
 *
 * @remarks
 * The lot is an axis-aligned rectangle with its front on the bottom edge, so the
 * buildable area is also a rectangle. Because a rectangle is convex, a room lies
 * inside it exactly when every corner does: no polygon clipping is needed.
 */

import type { Lot, Rect, Room } from '../types';

const CM_PER_M = 100;
const PLAIN_DECIMAL = /^\d+(\.\d+)?$/;

/**
 * Parses a length typed in metres, accepting a comma or a dot as the decimal separator.
 *
 * @remarks
 * Zero is accepted because a zero side setback is common in Brazilian codes; `validateLot`
 * decides whether the resulting lot makes sense.
 *
 * @param input - Raw text from the input field.
 * @returns Length in whole centimetres, or null when the text is empty, negative or not a number.
 * @example
 * parseLengthInput('1,5') // → 150
 */
export function parseLengthInput(input: string): number | null {
  const normalised = input.trim().replace(',', '.');
  if (!PLAIN_DECIMAL.test(normalised)) return null;
  return Math.round(Number(normalised) * CM_PER_M);
}

/**
 * Checks user-entered lot values before they are stored.
 *
 * @param lot - Candidate lot.
 * @returns `'invalidSize'` when width or depth is not positive, `'noBuildableArea'` when the
 *   setbacks leave no area, otherwise null.
 */
export function validateLot(lot: Lot): 'invalidSize' | 'noBuildableArea' | null {
  if (lot.width <= 0 || lot.depth <= 0) return 'invalidSize';
  const { front, back, left, right } = lot.setbacks;
  if (left + right >= lot.width || front + back >= lot.depth) return 'noBuildableArea';
  return null;
}

/**
 * Returns the buildable rectangle inside the setbacks.
 *
 * @param lot - A lot that passed `validateLot`.
 * @returns Rectangle in centimetres.
 * @throws {Error} When the setbacks leave no buildable area.
 * @example
 * buildableRect({ origin: { x: 0, y: 0 }, width: 1200, depth: 3000,
 *   setbacks: { front: 500, back: 300, left: 150, right: 150 } })
 * // → { x: 150, y: 300, width: 900, height: 2200 }
 */
export function buildableRect(lot: Lot): Rect {
  if (validateLot(lot) !== null) throw new Error('Lot has no buildable area');
  const { front, back, left, right } = lot.setbacks;
  return {
    x: lot.origin.x + left,
    y: lot.origin.y + back,
    width: lot.width - left - right,
    height: lot.depth - front - back,
  };
}

/**
 * Returns the complete rooms that have at least one corner outside the buildable rectangle.
 *
 * @remarks
 * A corner exactly on a setback line counts as inside.
 *
 * @param rooms - All rooms in the project.
 * @param lot - The project's lot.
 * @returns Rooms crossing a setback, in their original order.
 */
export function roomsOutsideSetbacks(rooms: readonly Room[], lot: Lot): Room[] {
  const r = buildableRect(lot);
  return rooms.filter(
    (room) =>
      room.isComplete &&
      room.corners.some(
        ({ position: p }) => p.x < r.x || p.x > r.x + r.width || p.y < r.y || p.y > r.y + r.height
      )
  );
}

/**
 * Taxa de ocupação: occupied area divided by lot area.
 *
 * @param occupiedCm2 - Sum of room areas in square centimetres.
 * @param lot - The project's lot.
 * @returns A fraction, e.g. 0.273 for 27,3 %.
 */
export function occupancyRatio(occupiedCm2: number, lot: Lot): number {
  return occupiedCm2 / (lot.width * lot.depth);
}

/**
 * Reads a lot from an opened project file, which is untrusted input.
 *
 * @param value - The file's `lot` field, if any.
 * @returns The lot when every field is a whole number and `validateLot` accepts it, otherwise undefined.
 */
export function parseSavedLot(value: unknown): Lot | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const v = value as Record<string, unknown>;
  const origin = v.origin as Record<string, unknown> | undefined;
  const setbacks = v.setbacks as Record<string, unknown> | undefined;
  const nums = [origin?.x, origin?.y, v.width, v.depth, setbacks?.front, setbacks?.back, setbacks?.left, setbacks?.right];
  if (!nums.every((n) => Number.isInteger(n))) return undefined;
  const lot = value as Lot;
  return validateLot(lot) === null ? lot : undefined;
}
