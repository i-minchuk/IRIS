// frontend/src/stores/appModeStore.ts
import { create } from 'zustand';
import { getMeta, type AppMeta } from '@/shared/api/meta';

interface AppModeState {
  meta: AppMeta | null;
  loaded: boolean;
  fetchMeta: () => Promise<void>;
}

export const useAppModeStore = create<AppModeState>((set, get) => ({
  meta: null,
  loaded: false,
  fetchMeta: async () => {
    if (get().loaded) return;
    try {
      const { data } = await getMeta();
      set({ meta: data, loaded: true });
    } catch {
      // Без метаданных считаем рабочий режим — не блокируем UI
      set({ loaded: true });
    }
  },
}));

export const useIsDemo = () => useAppModeStore((s) => s.meta?.mode === 'demo');
