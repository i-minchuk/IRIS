import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ZoomState {
  scale: number;
  setScale: (scale: number) => void;
  reset: () => void;
}

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.5;
const STEP = 0.05;
const DEFAULT_SCALE = 1;

export const useZoomStore = create<ZoomState>()(
  persist(
    (set) => ({
      scale: DEFAULT_SCALE,
      setScale: (scale) =>
        set({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(scale / STEP) * STEP)) }),
      reset: () => set({ scale: DEFAULT_SCALE }),
    }),
    {
      name: 'zoom-storage',
    }
  )
);

export { MIN_SCALE, MAX_SCALE, STEP, DEFAULT_SCALE };
