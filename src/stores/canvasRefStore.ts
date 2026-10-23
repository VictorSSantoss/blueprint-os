import { create } from 'zustand';
import type Konva from 'konva';

interface CanvasRefState {
  stageRef: Konva.Stage | null;
  setStageRef: (ref: Konva.Stage | null) => void;
}

export const useCanvasRefStore = create<CanvasRefState>((set) => ({
  stageRef: null,
  setStageRef: (ref) => set({ stageRef: ref }),
}));
