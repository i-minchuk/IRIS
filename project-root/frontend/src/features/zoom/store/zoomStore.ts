import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ZoomState {
  scale: number;
  hidden: boolean;
  setScale: (scale: number) => void;
  reset: () => void;
  setHidden: (hidden: boolean) => void;
}

const MIN_SCALE = 0.75;
const MAX_SCALE = 1.5;
const STEP = 0.05;
const DEFAULT_SCALE = 1;

export const useZoomStore = create<ZoomState>()(
  persist(
    (set) => ({
      scale: DEFAULT_SCALE,
      hidden: false,
      setScale: (scale) =>
        set({ 
          scale: Math.min(
            MAX_SCALE, 
            Math.max(
              MIN_SCALE, 
              Math.round(scale / STEP) * STEP
            )
          ) 
        }),
      reset: () => set({ scale: DEFAULT_SCALE }),
      setHidden: (hidden) => set({ hidden }),
    }),
    {
      name: 'zoom-storage',
      partialize: (state) => ({ scale: state.scale }), // hidden НЕ сохраняем в localStorage
    }
  )
);

export { MIN_SCALE, MAX_SCALE, STEP, DEFAULT_SCALE };