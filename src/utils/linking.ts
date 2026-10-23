/**
 * Coincident corner linking utilities (ADR-0002).
 *
 * @remarks
 * Two corners from different rooms are "linked" when their positions are
 * identical integers. Linking is purely positional — no extra field is stored
 * on `Corner`. All functions are pure: they take rooms in and return new
 * rooms out without mutation.
 */

import type { Room, Point } from '../types';
import { distance, polygonArea } from './geometry';

/** A dragged or placed corner within this distance snaps to an existing corner. */
export const CORNER_SNAP_TOLERANCE_CM = 20;

/**
 * Returns every (roomId, cornerId) pair whose position equals `position` exactly.
 *
 * @param rooms - All rooms in the project.
 * @param position - Integer centimetre position to match.
 * @returns All corners at that position, across all rooms.
 */
export function findLinkedCorners(
  rooms: readonly Room[],
  position: Point
): { roomId: string; cornerId: string }[] {
  const results: { roomId: string; cornerId: string }[] = [];
  for (const room of rooms) {
    for (const corner of room.corners) {
      if (corner.position.x === position.x && corner.position.y === position.y) {
        results.push({ roomId: room.id, cornerId: corner.id });
      }
    }
  }
  return results;
}

/**
 * Returns a new rooms array with every corner at `from` translated by `delta`.
 *
 * @param rooms - All rooms in the project.
 * @param from - The integer position to match.
 * @param delta - Translation in whole centimetres.
 * @returns New rooms array; rooms with no matching corner are returned as-is.
 */
export function moveLinkedCorners(
  rooms: readonly Room[],
  from: Point,
  delta: { dx: number; dy: number }
): Room[] {
  return rooms.map((room) => {
    const hasLinked = room.corners.some(
      (c) => c.position.x === from.x && c.position.y === from.y
    );
    if (!hasLinked) return room as Room;
    return {
      ...room,
      corners: room.corners.map((c) =>
        c.position.x === from.x && c.position.y === from.y
          ? { ...c, position: { x: c.position.x + delta.dx, y: c.position.y + delta.dy } }
          : c
      ),
    };
  });
}

/**
 * Returns the position of the nearest corner from any room other than
 * `excludeRoomId` that is within `tolerance` of `point`, or `null` if none.
 *
 * @param rooms - All rooms in the project.
 * @param point - The query position in centimetres.
 * @param tolerance - Maximum distance in centimetres to qualify as a snap.
 * @param excludeRoomId - Room to skip (the room being dragged, to avoid self-snap).
 * @param excludePosition - Corners exactly here are skipped. A dragged corner passes its own
 *   position so the corners linked to it, which move with it, are not snap targets.
 * @returns Exact position of the nearest qualifying corner, or null.
 * @example
 * snapToNearestCorner(rooms, { x: 208, y: 100 }, 20)
 * // → { x: 200, y: 100 } when a corner exists there
 */
export function snapToNearestCorner(
  rooms: readonly Room[],
  point: Point,
  tolerance: number,
  excludeRoomId?: string,
  excludePosition?: Point
): Point | null {
  let nearest: Point | null = null;
  let nearestDist = tolerance;

  for (const room of rooms) {
    if (room.id === excludeRoomId) continue;
    for (const corner of room.corners) {
      if (
        excludePosition &&
        corner.position.x === excludePosition.x &&
        corner.position.y === excludePosition.y
      ) {
        continue;
      }
      const d = distance(point, corner.position);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = corner.position;
      }
    }
  }

  return nearest;
}

/**
 * Returns true when the room has positive area, no zero-length walls and no
 * self-intersecting edges.
 *
 * @param room - The room to validate.
 * @returns False if area is zero, two adjacent corners coincide, or any non-adjacent edges cross.
 */
export function isValidRoom(room: Room): boolean {
  const points = room.corners.map((c) => c.position);
  if (points.length < 3) return false;
  if (polygonArea(points) <= 0) return false;

  const n = points.length;
  for (let i = 0; i < n; i++) {
    const next = points[(i + 1) % n];
    if (points[i].x === next.x && points[i].y === next.y) return false;
  }

  // Check every pair of non-adjacent edges for interior intersection.
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      // The last edge (n-1 → 0) is adjacent to the first edge (0 → 1).
      if (i === 0 && j === n - 1) continue;
      if (segmentsIntersectStrict(points[i], points[(i + 1) % n], points[j], points[(j + 1) % n])) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Returns true when the two segments cross in their strict interiors
 * (not at shared endpoints). Used for self-intersection detection.
 */
function segmentsIntersectStrict(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const denom =
    (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
  if (Math.abs(denom) < 1e-10) return false; // parallel or collinear

  const ua =
    ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
  const ub =
    ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;

  return ua > 0 && ua < 1 && ub > 0 && ub < 1;
}
