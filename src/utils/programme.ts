/**
 * Room programme (programa de necessidades) utilities — FDD-0003.
 *
 * @remarks
 * Targets are stored as integer square centimetres (ADR-0003), like every other
 * measurement; only the panel converts them to m² for display.
 */

import type { Room } from '../types';

/** Allowed gap between target and actual area, as a fraction of the target. */
export const PROGRAMME_TOLERANCE = 0.05;

const CM2_PER_M2 = 10000;
const PLAIN_DECIMAL = /^\d+(\.\d+)?$/;

/**
 * Parses a target area typed in m², accepting a comma or a dot as the decimal separator.
 *
 * @remarks
 * Only one separator is accepted, so a thousands-grouped value such as `1.234,5`
 * is rejected instead of being misread.
 *
 * @param input - Raw text from the input field.
 * @returns Area in whole square centimetres, or null when the text is empty, not a number, or not positive.
 * @example
 * parseAreaInput('14,5') // → 145000
 * parseAreaInput('abc')  // → null
 */
export function parseAreaInput(input: string): number | null {
  const normalised = input.trim().replace(',', '.');
  if (!PLAIN_DECIMAL.test(normalised)) return null;
  const cm2 = Math.round(Number(normalised) * CM2_PER_M2);
  return cm2 > 0 ? cm2 : null;
}

/**
 * Compares a room's actual area with its target.
 *
 * @param actualCm2 - Drawn area in square centimetres.
 * @param targetCm2 - Target area in square centimetres.
 * @returns `diffCm2` (actual − target; negative means the room is too small) and whether
 *   the gap is within {@link PROGRAMME_TOLERANCE} of the target.
 * @throws {Error} When the target is not positive.
 * @example
 * compareToTarget(126000, 140000) // → { diffCm2: -14000, withinTolerance: false }
 */
export function compareToTarget(
  actualCm2: number,
  targetCm2: number
): { diffCm2: number; withinTolerance: boolean } {
  if (targetCm2 <= 0) throw new Error(`Target area must be positive, got ${targetCm2}`);
  const diffCm2 = actualCm2 - targetCm2;
  return { diffCm2, withinTolerance: Math.abs(diffCm2) <= targetCm2 * PROGRAMME_TOLERANCE };
}

/**
 * Returns the first `"<base> N"` name (N = 1, 2, …) not already used by a room.
 *
 * @param rooms - All rooms in the project.
 * @param base - Localised base word, e.g. `Cômodo`.
 * @returns A name such as `Cômodo 2`.
 * @example
 * nextRoomName([{ name: 'Cômodo 1' }, { name: 'Cômodo 3' }], 'Cômodo') // → 'Cômodo 2'
 */
export function nextRoomName(rooms: readonly Pick<Room, 'name'>[], base: string): string {
  const used = new Set(rooms.map((r) => r.name));
  let n = 1;
  while (used.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
