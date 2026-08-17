import { create } from 'zustand';
import type { Release } from '@/types/release';
import { getReleases, updateRelease } from '@/features/admin/api/releasesApi';

interface ReleaseState {
  releases: Release[];
  selectedRelease: Release | null;
  isLoading: boolean;
  error: string | null;

  fetchReleases: () => Promise<void>;
  setReleases: (releases: Release[]) => void;
  selectRelease: (release: Release | null) => void;
  toggleChecklistItem: (releaseId: number, itemId: string) => Promise<void>;
  approveRelease: (releaseId: number, approver: string) => Promise<void>;
  getReleaseByStatus: (status: Release['status']) => Release[];
  getReadyReleases: () => Release[];
  getChecklistProgress: (releaseId: number) => number;
}

export const useReleaseStore = create<ReleaseState>((set, get) => ({
  releases: [],
  selectedRelease: null,
  isLoading: false,
  error: null,

  fetchReleases: async () => {
    set({ isLoading: true, error: null });
    try {
      const releases = await getReleases();
      set(state => ({
        releases,
        isLoading: false,
        // Обновляем выбранный релиз свежими данными, если он открыт
        selectedRelease: state.selectedRelease
          ? releases.find(r => r.id === state.selectedRelease!.id) ?? null
          : null,
      }));
    } catch (err) {
      console.error('Failed to load releases:', err);
      set({ isLoading: false, error: 'Не удалось загрузить релизы' });
    }
  },

  setReleases: (releases) => set({ releases }),
  selectRelease: (release) => set({ selectedRelease: release }),

  toggleChecklistItem: async (releaseId, itemId) => {
    const release = get().releases.find(r => r.id === releaseId);
    if (!release) return;
    const checklist = release.checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    try {
      const updated = await updateRelease(releaseId, { checklist });
      set(state => ({
        releases: state.releases.map(r => (r.id === releaseId ? updated : r)),
        selectedRelease: state.selectedRelease?.id === releaseId ? updated : state.selectedRelease,
      }));
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
      set({ error: 'Не удалось обновить чек-лист релиза' });
    }
  },

  approveRelease: async (releaseId, approver) => {
    const release = get().releases.find(r => r.id === releaseId);
    if (!release) return;
    try {
      const updated = await updateRelease(releaseId, {
        approved_by: [...release.approved_by, approver],
      });
      set(state => ({
        releases: state.releases.map(r => (r.id === releaseId ? updated : r)),
        selectedRelease: state.selectedRelease?.id === releaseId ? updated : state.selectedRelease,
      }));
    } catch (err) {
      console.error('Failed to approve release:', err);
      set({ error: 'Не удалось утвердить релиз' });
    }
  },

  getReleaseByStatus: (status) => get().releases.filter(r => r.status === status),
  getReadyReleases: () => get().releases.filter(r => r.status === 'ready'),

  getChecklistProgress: (releaseId) => {
    const release = get().releases.find(r => r.id === releaseId);
    if (!release) return 0;
    return release.checklist_progress;
  },
}));
