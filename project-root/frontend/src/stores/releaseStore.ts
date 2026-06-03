import { create } from 'zustand';
import type { Release } from '@/types/release';
import { releases as mockReleases } from '@/api/mocks/releases';

interface ReleaseState {
  releases: Release[];
  selectedRelease: Release | null;

  setReleases: (releases: Release[]) => void;
  selectRelease: (release: Release | null) => void;
  toggleChecklistItem: (releaseId: number, itemId: string) => void;
  approveRelease: (releaseId: number, approver: string) => void;
  getReleaseByStatus: (status: Release['status']) => Release[];
  getReadyReleases: () => Release[];
  getChecklistProgress: (releaseId: number) => number;
}

export const useReleaseStore = create<ReleaseState>((set, get) => ({
  releases: mockReleases,
  selectedRelease: null,

  setReleases: (releases) => set({ releases }),
  selectRelease: (release) => set({ selectedRelease: release }),

  toggleChecklistItem: (releaseId, itemId) => {
    set(state => ({
      releases: state.releases.map(r => {
        if (r.id !== releaseId) return r;
        const updated = r.checklist.map(item =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        const progress = updated.length > 0
          ? Math.round((updated.filter(i => i.completed).length / updated.length) * 100)
          : 0;
        return { ...r, checklist: updated, checklist_progress: progress };
      }),
    }));
  },

  approveRelease: (releaseId, approver) => {
    set(state => ({
      releases: state.releases.map(r =>
        r.id === releaseId
          ? { ...r, approved_by: [...r.approved_by, approver] }
          : r
      ),
    }));
  },

  getReleaseByStatus: (status) => get().releases.filter(r => r.status === status),
  getReadyReleases: () => get().releases.filter(r => r.status === 'ready'),

  getChecklistProgress: (releaseId) => {
    const release = get().releases.find(r => r.id === releaseId);
    if (!release) return 0;
    return release.checklist_progress;
  },
}));
