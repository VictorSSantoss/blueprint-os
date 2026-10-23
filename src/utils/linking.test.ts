import { describe, it, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import type { Room } from '../types';
import { makeRectRoom } from '../test/factories';
import {
  CORNER_SNAP_TOLERANCE_CM,
  findLinkedCorners,
  moveLinkedCorners,
  snapToNearestCorner,
  isValidRoom,
} from './linking';


// ---------------------------------------------------------------------------
// findLinkedCorners
// ---------------------------------------------------------------------------

describe('findLinkedCorners', () => {
  it('returns nothing when no corners share the position', () => {
    const rooms = [makeRectRoom(0, 0, 400, 300)];

    const result = findLinkedCorners(rooms, { x: 999, y: 999 });

    expect(result).toHaveLength(0);
  });

  it('returns the one corner that matches exactly', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    const rooms = [room];

    const result = findLinkedCorners(rooms, { x: 400, y: 0 });

    expect(result).toHaveLength(1);
    expect(result[0].roomId).toBe(room.id);
    expect(result[0].cornerId).toBe(room.corners[1].id);
  });

  it('[FDD-0002 / AC-02] returns both corners when two rooms share a position', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const roomB = makeRectRoom(400, 0, 200, 300);
    const rooms = [roomA, roomB];

    // Shared position: top-right of A = top-left of B = (400, 0)
    const result = findLinkedCorners(rooms, { x: 400, y: 0 });

    expect(result).toHaveLength(2);
    const roomIds = result.map((r) => r.roomId);
    expect(roomIds).toContain(roomA.id);
    expect(roomIds).toContain(roomB.id);
  });

  it('does not match positions that differ by 1 cm', () => {
    const rooms = [makeRectRoom(0, 0, 400, 300)];

    const result = findLinkedCorners(rooms, { x: 401, y: 0 });

    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// moveLinkedCorners
// ---------------------------------------------------------------------------

describe('moveLinkedCorners', () => {
  it('moves only corners at the given position', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    const rooms = [room];

    const result = moveLinkedCorners(rooms, { x: 400, y: 0 }, { dx: 50, dy: 0 });

    const updatedRoom = result.find((r) => r.id === room.id)!;
    // Corner at (400, 0) → (450, 0)
    expect(updatedRoom.corners.find((c) => c.id === room.corners[1].id)!.position).toEqual({ x: 450, y: 0 });
    // Other corners unchanged
    expect(updatedRoom.corners.find((c) => c.id === room.corners[0].id)!.position).toEqual({ x: 0, y: 0 });
  });

  it('[FDD-0002 / AC-02] moves the matching corner in both rooms simultaneously', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const roomB = makeRectRoom(400, 0, 200, 300);
    const rooms = [roomA, roomB];

    // Move the shared corner at (400, 0) 50 cm to the right
    const result = moveLinkedCorners(rooms, { x: 400, y: 0 }, { dx: 50, dy: 0 });

    const updA = result.find((r) => r.id === roomA.id)!;
    const updB = result.find((r) => r.id === roomB.id)!;

    expect(updA.corners.find((c) => c.id === roomA.corners[1].id)!.position).toEqual({ x: 450, y: 0 });
    expect(updB.corners.find((c) => c.id === roomB.corners[0].id)!.position).toEqual({ x: 450, y: 0 });
  });

  it('does not mutate the original rooms array', () => {
    const rooms = [makeRectRoom(0, 0, 400, 300)];
    const original = JSON.stringify(rooms);

    moveLinkedCorners(rooms, { x: 400, y: 0 }, { dx: 50, dy: 0 });

    expect(JSON.stringify(rooms)).toBe(original);
  });
});

// ---------------------------------------------------------------------------
// snapToNearestCorner
// ---------------------------------------------------------------------------

describe('snapToNearestCorner', () => {
  it('[FDD-0002 / AC-01] snaps to a corner within tolerance', () => {
    const rooms = [makeRectRoom(0, 0, 400, 300)];

    const result = snapToNearestCorner(rooms, { x: 408, y: 2 }, CORNER_SNAP_TOLERANCE_CM);

    // Nearest existing corner is (400, 0), distance ≈ 8.2 cm — within 20 cm
    expect(result).toEqual({ x: 400, y: 0 });
  });

  it('returns null when no corner is within tolerance', () => {
    const rooms = [makeRectRoom(0, 0, 400, 300)];

    const result = snapToNearestCorner(rooms, { x: 500, y: 500 }, CORNER_SNAP_TOLERANCE_CM);

    expect(result).toBeNull();
  });

  it('[FDD-0002 / AC-05] excludes corners from the specified room', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const rooms = [roomA];

    // Query near (400, 0) but exclude roomA — should return null
    const result = snapToNearestCorner(rooms, { x: 402, y: 0 }, CORNER_SNAP_TOLERANCE_CM, roomA.id);

    expect(result).toBeNull();
  });

  it('ignores corners at excludePosition (linked partners move with the dragged corner)', () => {
    const roomA = makeRectRoom(0, 0, 200, 200);
    const roomB = makeRectRoom(200, 0, 200, 200); // B's top-left (200, 0) is linked to A's top-right
    const rooms = [roomA, roomB];

    // Dragging A's (200, 0) corner 10 cm away must not snap back onto its own linked partner.
    const result = snapToNearestCorner(rooms, { x: 210, y: 0 }, CORNER_SNAP_TOLERANCE_CM, roomA.id, { x: 200, y: 0 });

    expect(result).toBeNull();
  });

  it('returns the closest corner when multiple are within tolerance', () => {
    const roomA = makeRectRoom(0, 0, 200, 200); // corner at (200, 0)
    const roomB = makeRectRoom(225, 0, 200, 200); // corner at (225, 0)
    const rooms = [roomA, roomB];

    // Query at (218, 0): 18 cm from A's corner, 7 cm from B's — both within tolerance
    const result = snapToNearestCorner(rooms, { x: 218, y: 0 }, CORNER_SNAP_TOLERANCE_CM);

    expect(result).toEqual({ x: 225, y: 0 });
  });
});

// ---------------------------------------------------------------------------
// isValidRoom
// ---------------------------------------------------------------------------

describe('isValidRoom', () => {
  it('returns true for a valid rectangle', () => {
    const room = makeRectRoom(0, 0, 400, 300);

    expect(isValidRoom(room)).toBe(true);
  });

  it('[FDD-0002 / AC-04] returns false when area is zero (collapsed room)', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    // Collapse width to zero: move all right-side corners to x=0
    const collapsed: Room = {
      ...room,
      corners: room.corners.map((c) => ({
        ...c,
        position: { x: 0, y: c.position.y },
      })),
    };

    expect(isValidRoom(collapsed)).toBe(false);
  });

  it('returns false for a self-intersecting polygon (bowtie)', () => {
    // Bowtie: corners go (0,0) → (400,300) → (400,0) → (0,300)
    const corners = [
      { id: uuidv4(), position: { x: 0,   y: 0   } },
      { id: uuidv4(), position: { x: 400, y: 300  } },
      { id: uuidv4(), position: { x: 400, y: 0   } },
      { id: uuidv4(), position: { x: 0,   y: 300 } },
    ];
    const room: Room = {
      id: uuidv4(),
      name: 'Bowtie',
      corners,
      walls: corners.map((c, i) => ({
        id: uuidv4(),
        startCornerId: c.id,
        endCornerId: corners[(i + 1) % corners.length].id,
        thickness: 15,
      })),
      fillColor: '#f3f4f6',
      isComplete: true,
    };

    expect(isValidRoom(room)).toBe(false);
  });

  it('[FDD-0002 / INV-01] returns false when two adjacent corners share a position', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    // Move corner 1 onto corner 2: leaves a triangle with a zero-length wall.
    const degenerate: Room = {
      ...room,
      corners: room.corners.map((c, i) =>
        i === 1 ? { ...c, position: { ...room.corners[2].position } } : c
      ),
    };

    expect(isValidRoom(degenerate)).toBe(false);
  });

  it('returns false when fewer than 3 corners', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    const twoCorners: Room = { ...room, corners: room.corners.slice(0, 2) };

    expect(isValidRoom(twoCorners)).toBe(false);
  });
});
