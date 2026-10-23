import { v4 as uuidv4 } from 'uuid';
import type { Room } from '../types';

/**
 * Builds a complete rectangular room for tests.
 *
 * @param x - Left edge in centimetres.
 * @param y - Top edge in centimetres.
 * @param w - Width in centimetres.
 * @param h - Height in centimetres.
 * @param overrides - Fields to replace on the built room.
 * @returns A room with corners in clockwise order from the top-left, and walls corner[i] → corner[i+1].
 */
export function makeRectRoom(x: number, y: number, w: number, h: number, overrides: Partial<Room> = {}): Room {
  const corners = [
    { id: uuidv4(), position: { x, y } },
    { id: uuidv4(), position: { x: x + w, y } },
    { id: uuidv4(), position: { x: x + w, y: y + h } },
    { id: uuidv4(), position: { x, y: y + h } },
  ];
  return {
    id: uuidv4(),
    name: 'Room',
    corners,
    walls: corners.map((c, i) => ({
      id: uuidv4(),
      startCornerId: c.id,
      endCornerId: corners[(i + 1) % corners.length].id,
      thickness: 15,
    })),
    fillColor: '#f3f4f6',
    isComplete: true,
    ...overrides,
  };
}
