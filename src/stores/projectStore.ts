import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Room, FloorObject, DimensionLine, Point, ObjectType } from '../types';
import { OBJECT_CATALOG } from '../constants/objects';

interface ProjectState {
  id: string;
  name: string;
  rooms: Room[];
  objects: FloorObject[];
  dimensionLines: DimensionLine[];

  // Room actions
  addRoom: (room: Omit<Room, 'id'>) => string;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;

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
  loadProject: (data: { rooms: Room[]; objects: FloorObject[]; dimensionLines: DimensionLine[] }) => void;

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

      loadProject: (data) => {
        set({
          rooms: data.rooms,
          objects: data.objects,
          dimensionLines: data.dimensionLines,
        });
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
      }),
    }
  )
);
