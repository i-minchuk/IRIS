// src/pages/ArchivePage/store/archiveStore.ts
/**
 * Zustand store для Архива
 */
import { create } from 'zustand';
import { archiveApi, ArchiveEntry, ArchiveMaterial, ArchiveConstruction, TimelineEvent, ArchiveStatistics, SearchFilters } from '../api/archiveApi';

interface ArchiveState {
  // Данные
  entries: ArchiveEntry[];
  materials: ArchiveMaterial[];
  constructions: ArchiveConstruction[];
  timeline: TimelineEvent[];
  statistics: ArchiveStatistics | null;
  selectedEntry: ArchiveEntry | null;
  selectedMaterial: ArchiveMaterial | null;
  selectedConstruction: ArchiveConstruction | null;

  // Состояние загрузки
  isLoading: boolean;
  isSearchLoading: boolean;
  error: string | null;

  // Фильтры
  currentFilters: {
    projectId: string | null;
    entryTypes: string[];
    dateFrom: string | null;
    dateTo: string | null;
    hasAttachments: boolean;
    searchQuery: string;
  };

  // Методы
  setProjectId: (projectId: string) => Promise<void>;
  loadEntries: () => Promise<void>;
  loadMaterials: () => Promise<void>;
  loadConstructions: () => Promise<void>;
  loadTimeline: () => Promise<void>;
  loadStatistics: () => Promise<void>;
  search: (query: string, filters?: SearchFilters) => Promise<void>;
  selectEntry: (entry: ArchiveEntry | null) => void;
  selectMaterial: (material: ArchiveMaterial | null) => void;
  selectConstruction: (construction: ArchiveConstruction | null) => void;
  pinEntry: (entryId: string) => Promise<void>;
  unpinEntry: (entryId: string) => Promise<void>;
  createMaterial: (data: Partial<ArchiveMaterial>) => Promise<void>;
  createConstruction: (data: Partial<ArchiveConstruction>) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  entries: [],
  materials: [],
  constructions: [],
  timeline: [],
  statistics: null,
  selectedEntry: null,
  selectedMaterial: null,
  selectedConstruction: null,
  isLoading: false,
  isSearchLoading: false,
  error: null,
  currentFilters: {
    projectId: null,
    entryTypes: [],
    dateFrom: null,
    dateTo: null,
    hasAttachments: false,
    searchQuery: '',
  },
};

export const useArchiveStore = create<ArchiveState>((set, get) => ({
  ...initialState,

  setProjectId: async (projectId) => {
    set({ isLoading: true, error: null, currentFilters: { ...get().currentFilters, projectId } });
    try {
      await Promise.all([
        get().loadEntries(),
        get().loadMaterials(),
        get().loadConstructions(),
        get().loadTimeline(),
        get().loadStatistics(),
      ]);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка загрузки' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadEntries: async () => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const entries = await archiveApi.getEntries(currentFilters.projectId, {
        date_from: currentFilters.dateFrom || undefined,
        date_to: currentFilters.dateTo || undefined,
        entry_types: currentFilters.entryTypes,
        authors: [],
        has_attachments: currentFilters.hasAttachments,
      });
      set({ entries });
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
  },

  loadMaterials: async () => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const materials = await archiveApi.getMaterials(currentFilters.projectId);
      set({ materials });
    } catch (err) {
      console.error('Failed to load materials:', err);
    }
  },

  loadConstructions: async () => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const constructions = await archiveApi.getConstructions(currentFilters.projectId);
      set({ constructions });
    } catch (err) {
      console.error('Failed to load constructions:', err);
    }
  },

  loadTimeline: async () => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const timeline = await archiveApi.getTimeline(currentFilters.projectId, {
        date_from: currentFilters.dateFrom || undefined,
        date_to: currentFilters.dateTo || undefined,
      });
      set({ timeline });
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  },

  loadStatistics: async () => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const statistics = await archiveApi.getStatistics(currentFilters.projectId);
      set({ statistics });
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  },

  search: async (query: string, filters?: SearchFilters) => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    set({ isSearchLoading: true, error: null, currentFilters: { ...currentFilters, searchQuery: query } });
    try {
      const result = await archiveApi.search(query, currentFilters.projectId, filters);
      set({
        entries: result.entries,
        isSearchLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Ошибка поиска', isSearchLoading: false });
    }
  },

  selectEntry: (entry) => set({ selectedEntry: entry }),
  selectMaterial: (material) => set({ selectedMaterial: material }),
  selectConstruction: (construction) => set({ selectedConstruction: construction }),

  pinEntry: async (entryId: string) => {
    try {
      const pinned = await archiveApi.pinEntry(entryId);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === entryId ? pinned : e)),
        selectedEntry: pinned,
      }));
    } catch (err) {
      console.error('Failed to pin entry:', err);
    }
  },

  unpinEntry: async (entryId: string) => {
    try {
      const unpinned = await archiveApi.unpinEntry(entryId);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === entryId ? unpinned : e)),
        selectedEntry: unpinned,
      }));
    } catch (err) {
      console.error('Failed to unpin entry:', err);
    }
  },

  createMaterial: async (data) => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const material = await archiveApi.createMaterial({ ...data, project_id: currentFilters.projectId });
      set((state) => ({ materials: [...state.materials, material] }));
    } catch (err) {
      console.error('Failed to create material:', err);
    }
  },

  createConstruction: async (data) => {
    const { currentFilters } = get();
    if (!currentFilters.projectId) return;

    try {
      const construction = await archiveApi.createConstruction({ ...data, project_id: currentFilters.projectId });
      set((state) => ({ constructions: [...state.constructions, construction] }));
    } catch (err) {
      console.error('Failed to create construction:', err);
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
