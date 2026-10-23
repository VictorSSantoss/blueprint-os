import { describe, it, expect, beforeEach } from 'vitest';
import type { Room } from '../types';
import { useProjectStore } from './projectStore';
import { makeRectRoom } from '../test/factories';

function cornerPos(roomId: string, cornerId: string) {
  const room = useProjectStore.getState().rooms.find((r) => r.id === roomId)!;
  return room.corners.find((c) => c.id === cornerId)!.position;
}

beforeEach(() => {
  useProjectStore.setState({ rooms: [] });
});

describe('moveCorner', () => {
  it('moves a corner of a single, unlinked room', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    useProjectStore.setState({ rooms: [room] });

    useProjectStore.getState().moveCorner(room.id, room.corners[2].id, { x: 500, y: 350 });

    expect(cornerPos(room.id, room.corners[2].id)).toEqual({ x: 500, y: 350 });
  });

  it('[FDD-0002 / AC-02] moves the coincident corner of the neighbouring room too', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const roomB = makeRectRoom(400, 0, 200, 300);
    useProjectStore.setState({ rooms: [roomA, roomB] });

    // Shared corner: A's top-right = B's top-left = (400, 0)
    useProjectStore.getState().moveCorner(roomA.id, roomA.corners[1].id, { x: 450, y: 0 });

    expect(cornerPos(roomA.id, roomA.corners[1].id)).toEqual({ x: 450, y: 0 });
    expect(cornerPos(roomB.id, roomB.corners[0].id)).toEqual({ x: 450, y: 0 });
  });

  it('[FDD-0002 / AC-04 / INV-02] rejects a move that collapses the room to zero area', () => {
    // Triangle (0,0) (400,0) (400,300), built from a rectangle minus its last corner.
    const rect = makeRectRoom(0, 0, 400, 300);
    const corners = rect.corners.slice(0, 3);
    const ids = new Set(corners.map((c) => c.id));
    const room: Room = {
      ...rect,
      corners,
      walls: rect.walls.filter((w) => ids.has(w.startCornerId) && ids.has(w.endCornerId)),
    };
    useProjectStore.setState({ rooms: [room] });

    // Dragging the third corner onto the line through the other two gives zero area.
    useProjectStore.getState().moveCorner(room.id, room.corners[2].id, { x: 800, y: 0 });

    expect(cornerPos(room.id, room.corners[2].id)).toEqual({ x: 400, y: 300 });
  });

  it('rejects a move that would also invalidate a linked neighbour', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const roomB = makeRectRoom(400, 0, 200, 300);
    useProjectStore.setState({ rooms: [roomA, roomB] });

    // Moving the shared corner (400, 0) onto A's bottom-right corner (400, 300) leaves
    // both rooms with a zero-length wall (INV-01), so the whole move is rejected.
    useProjectStore.getState().moveCorner(roomA.id, roomA.corners[1].id, { x: 400, y: 300 });

    expect(cornerPos(roomA.id, roomA.corners[1].id)).toEqual({ x: 400, y: 0 });
    expect(cornerPos(roomB.id, roomB.corners[0].id)).toEqual({ x: 400, y: 0 });
  });

  it('[FDD-0002 / INV-03] a linked move is a single store update', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const roomB = makeRectRoom(400, 0, 200, 300);
    useProjectStore.setState({ rooms: [roomA, roomB] });
    let updates = 0;
    const unsubscribe = useProjectStore.subscribe(() => {
      updates += 1;
    });

    useProjectStore.getState().moveCorner(roomA.id, roomA.corners[1].id, { x: 450, y: 0 });
    unsubscribe();

    expect(updates).toBe(1);
  });
});

describe('moveWall', () => {
  it('[FDD-0002 / AC-03] moves both rooms when their shared wall is dragged', () => {
    const roomA = makeRectRoom(0, 0, 400, 300);
    const roomB = makeRectRoom(400, 0, 200, 300);
    useProjectStore.setState({ rooms: [roomA, roomB] });

    // A's right wall: corner[1] (400,0) → corner[2] (400,300)
    const rightWall = roomA.walls[1];
    useProjectStore.getState().moveWall(roomA.id, rightWall.id, { dx: 50, dy: 0 });

    expect(cornerPos(roomA.id, roomA.corners[1].id)).toEqual({ x: 450, y: 0 });
    expect(cornerPos(roomA.id, roomA.corners[2].id)).toEqual({ x: 450, y: 300 });
    expect(cornerPos(roomB.id, roomB.corners[0].id)).toEqual({ x: 450, y: 0 });
    expect(cornerPos(roomB.id, roomB.corners[3].id)).toEqual({ x: 450, y: 300 });
  });

  it('rejects a wall drag that would collapse the room', () => {
    const room = makeRectRoom(0, 0, 400, 300);
    useProjectStore.setState({ rooms: [room] });

    // Dragging the right wall 400 cm left puts it on the left wall: zero area.
    useProjectStore.getState().moveWall(room.id, room.walls[1].id, { dx: -400, dy: 0 });

    expect(cornerPos(room.id, room.corners[1].id)).toEqual({ x: 400, y: 0 });
  });
});

describe('lot actions', () => {
  const lot = { origin: { x: 0, y: 0 }, width: 1200, depth: 3000, setbacks: { front: 500, back: 300, left: 150, right: 150 } };

  beforeEach(() => {
    useProjectStore.setState({ lot: undefined });
  });

  it('setLot stores the lot', () => {
    useProjectStore.getState().setLot(lot);

    expect(useProjectStore.getState().lot).toEqual(lot);
  });

  it('[FDD-0004 / AC-05] moveLot translates only the origin', () => {
    useProjectStore.getState().setLot(lot);

    useProjectStore.getState().moveLot({ dx: 100, dy: -50 });

    expect(useProjectStore.getState().lot).toEqual({ ...lot, origin: { x: 100, y: -50 } });
  });

  it('removeLot clears it', () => {
    useProjectStore.getState().setLot(lot);

    useProjectStore.getState().removeLot();

    expect(useProjectStore.getState().lot).toBeUndefined();
  });
});
