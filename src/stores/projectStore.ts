import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room, FloorObject, DimensionLine, Point, ObjectType, Lot } from '../types';
import { OBJECT_CATALOG } from '../constants/objects';
import { moveLinkedCorners, isValidRoom } from '../utils/linking';

interface ProjectState {
  id: string;
  name: string;
  rooms: Room[];
  objects: FloorObject[];
  dimensionLines: DimensionLine[];
  /** The project's lot (FDD-0004); absent until the user defines one. */
  lot?: Lot;

  // Room actions
  addRoom: (room: Omit<Room, 'id'>) => string;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  /**
   * Moves one corner, and every corner of any room sitting at the same position, to `newPosition`.
   *
   * @remarks
   * Linked corners (ADR-0002) move in a single store update so a shared wall never opens.
   * The whole move is rejected, leaving the store untouched, if any affected room would end up
   * with zero area, a zero-length wall or crossing edges (FDD-0002 INV-01, INV-02).
   *
   * @param roomId - Room that owns the dragged corner.
   * @param cornerId - Corner being dragged.
   * @param newPosition - Target position in whole centimetres.
   */
  moveCorner: (roomId: string, cornerId: string, newPosition: Point) => void;
  /**
   * Translates both endpoints of a wall, and every corner linked to them, by `delta`.
   *
   * @remarks
   * Same all-or-nothing validity rule and single store update as `moveCorner`.
   *
   * @param roomId - Room that owns the wall.
   * @param wallId - Wall being dragged.
   * @param delta - Translation in whole centimetres.
   */
  moveWall: (roomId: string, wallId: string, delta: { dx: number; dy: number }) => void;

  // Object actions
  addObject: (type: ObjectType, position: Point) => string;
  addObjectWithData: (object: Omit<FloorObject, 'id'>) => string;
  updateObject: (id: string, updates: Partial<FloorObject>) => void;
  deleteObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => string[];
  moveObjects: (ids: string[], deltaX: number, deltaY: number) => void;
  rotateObjects: (ids: string[], angle: number) => void;

  // Dimension actions
  addDimensionLine: (line: Omit<DimensionLine, 'id'>) => string;
  deleteDimensionLine: (id: string) => void;

  // Project actions
  setProjectName: (name: string) => void;
  clearProject: () => void;

  // Lot actions (FDD-0004)
  /** Creates or replaces the lot. Callers validate it first with `validateLot`. */
  setLot: (lot: Lot) => void;
  /**
   * Moves the lot without changing its size or setbacks.
   *
   * @param delta - Translation in whole centimetres.
   */
  moveLot: (delta: { dx: number; dy: number }) => void;
  removeLot: () => void;

  // Getters
  getObjectById: (id: string) => FloorObject | undefined;
  getRoomById: (id: string) => Room | undefined;
}

const createDefaultProject = () => ({
  id: uuidv4(),
  name: 'Untitled Project',
  rooms: [],
  objects: [],
  dimensionLines: [],
  lot: undefined,
});

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      ...createDefaultProject(),

      addRoom: (room) => {
        const id = uuidv4();
        set((state) => ({
          rooms: [...state.rooms, { ...room, id }],
        }));
        return id;
      },

      updateRoom: (id, updates) => {
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === id ? { ...room, ...updates } : room
          ),
        }));
      },

      deleteRoom: (id) => {
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== id),
        }));
      },

      moveCorner: (roomId, cornerId, newPosition) => {
        const { rooms } = get();
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return;

        const corner = room.corners.find((c) => c.id === cornerId);
        if (!corner) return;

        const from = corner.position;
        const delta = { dx: newPosition.x - from.x, dy: newPosition.y - from.y };
        if (delta.dx === 0 && delta.dy === 0) return;

        const candidate = moveLinkedCorners(rooms, from, delta);
        const anyInvalid = candidate.some(
          (r, i) => r !== rooms[i] && !isValidRoom(r)
        );
        if (anyInvalid) return;

        set({ rooms: candidate });
      },

      moveWall: (roomId, wallId, delta) => {
        const { rooms } = get();
        const room = rooms.find((r) => r.id === roomId);
        if (!room) return;

        const wall = room.walls.find((w) => w.id === wallId);
        if (!wall) return;

        const startCorner = room.corners.find((c) => c.id === wall.startCornerId);
        const endCorner = room.corners.find((c) => c.id === wall.endCornerId);
        if (!startCorner || !endCorner) return;

        // Move start-linked corners, then end-linked corners.
        let candidate = moveLinkedCorners(rooms, startCorner.position, delta);
        candidate = moveLinkedCorners(candidate, endCorner.position, delta);

        const anyInvalid = candidate.some(
          (r, i) => r !== rooms[i] && !isValidRoom(r)
        );
        if (anyInvalid) return;

        set({ rooms: candidate });
      },

      addObject: (type, position) => {
        const definition = OBJECT_CATALOG[type];
        if (!definition) {
          console.error(`Unknown object type: ${type}`);
          return '';
        }

        const id = uuidv4();
        const newObject: FloorObject = {
          id,
          type,
          position,
          dimensions: { ...definition.defaultDimensions },
          rotation: 0,
          zIndex: get().objects.length,
          isLocked: false,
        };

        set((state) => ({
          objects: [...state.objects, newObject],
        }));
        return id;
      },

      addObjectWithData: (object) => {
        const id = uuidv4();
        set((state) => ({
          objects: [...state.objects, { ...object, id }],
        }));
        return id;
      },

      updateObject: (id, updates) => {
        set((state) => ({
          objects: state.objects.map((obj) =>
            obj.id === id ? { ...obj, ...updates } : obj
          ),
        }));
      },

      deleteObjects: (ids) => {
        set((state) => ({
          objects: state.objects.filter((obj) => !ids.includes(obj.id)),
        }));
      },

      duplicateObjects: (ids) => {
        const newIds: string[] = [];
        set((state) => {
          const objectsToDuplicate = state.objects.filter((obj) => ids.includes(obj.id));
          const duplicates = objectsToDuplicate.map((obj) => {
            const newId = uuidv4();
            newIds.push(newId);
            return {
              ...obj,
              id: newId,
              position: {
                x: obj.position.x + 20,
                y: obj.position.y + 20,
              },
              zIndex: state.objects.length + newIds.length - 1,
            };
          });
          return {
            objects: [...state.objects, ...duplicates],
          };
        });
        return newIds;
      },

      moveObjects: (ids, deltaX, deltaY) => {
        set((state) => ({
          objects: state.objects.map((obj) =>
            ids.includes(obj.id)
              ? {
                  ...obj,
                  position: {
                    x: obj.position.x + deltaX,
                    y: obj.position.y + deltaY,
                  },
                }
              : obj
          ),
        }));
      },

      rotateObjects: (ids, angle) => {
        set((state) => ({
          objects: state.objects.map((obj) =>
            ids.includes(obj.id)
              ? {
                  ...obj,
                  rotation: (obj.rotation + angle) % 360,
                }
              : obj
          ),
        }));
      },

      addDimensionLine: (line) => {
        const id = uuidv4();
        set((state) => ({
          dimensionLines: [...state.dimensionLines, { ...line, id }],
        }));
        return id;
      },

      deleteDimensionLine: (id) => {
        set((state) => ({
          dimensionLines: state.dimensionLines.filter((line) => line.id !== id),
        }));
      },

      setProjectName: (name) => {
        set({ name });
      },

      clearProject: () => {
        set(createDefaultProject());
      },

      setLot: (lot) => {
        set({ lot });
      },

      moveLot: ({ dx, dy }) => {
        const { lot } = get();
        if (!lot) return;
        set({ lot: { ...lot, origin: { x: lot.origin.x + dx, y: lot.origin.y + dy } } });
      },

      removeLot: () => {
        set({ lot: undefined });
      },

      getObjectById: (id) => {
        return get().objects.find((obj) => obj.id === id);
      },

      getRoomById: (id) => {
        return get().rooms.find((room) => room.id === id);
      },
    }),
    {
      name: 'floor-maker-project',
      partialize: (state) => ({
        id: state.id,
        name: state.name,
        rooms: state.rooms,
        objects: state.objects,
        dimensionLines: state.dimensionLines,
        lot: state.lot,
      }),
    }
  )
);
