import { create } from 'zustand';

interface ArchiveEvent {
  id: string;
  type: string;
  title: string;
  occurred_at: string;
  author_name?: string;
  data?: Record<string, any>;
}

interface ArchiveMaterial {
  id: string;
  name: string;
  material_type: string;
  quantity?: number;
  unit?: string;
}

interface ArchiveConstruction {
  id: string;
  name: string;
  construction_type: string;
  designation?: string;
  status: string;
}

interface ArchiveState {
  entries: ArchiveEvent[];
  materials: ArchiveMaterial[];
  constructions: ArchiveConstruction[];
  isLoading: boolean;
  error: string | null;
  activeTab: 'timeline' | 'materials' | 'constructions';
  setActiveTab: (tab: 'timeline' | 'materials' | 'constructions') => void;
  fetchArchive: (projectId?: string) => Promise<void>;
}

const API_BASE = '/api/v1';

export const useArchiveStore = create<ArchiveState>((set) => ({
  entries: [],
  materials: [],
  constructions: [],
  isLoading: false,
  error: null,
  activeTab: 'timeline',
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  fetchArchive: async (projectId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const projectParam = projectId ? `?project_id=${projectId}` : '';
      const [timelineRes, materialsRes, constructionsRes] = await Promise.all([
        fetch(`${API_BASE}/archive/timeline${projectParam}`).then(r => r.json()),
        fetch(`${API_BASE}/archive/materials${projectParam}`).then(r => r.json()),
        fetch(`${API_BASE}/archive/constructions${projectParam}`).then(r => r.json()),
      ]);
      
      set({
        entries: timelineRes.events || [],
        materials: materialsRes || [],
        constructions: constructionsRes || [],
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to fetch archive:', err);
      set({ 
        error: 'Ошибка загрузки архива. API может быть недоступен на SQLite.', 
        isLoading: false 
      });
    }
  },
}));
