import { create } from 'zustand';

export type SearchScope = 'current' | 'everywhere' | 'project';

export interface GlobalSearchState {
  activeTab: string | null;
  query: string;
  scope: SearchScope;
  setActiveTab: (activeTab: string | null) => void;
  setQuery: (query: string) => void;
  setScope: (scope: SearchScope) => void;
  reset: () => void;
}

export const useGlobalSearchStore = create<GlobalSearchState>((set) => ({
  activeTab: null,
  query: '',
  scope: 'current',
  setActiveTab: (activeTab) => set({ activeTab }),
  setQuery: (query) => set({ query }),
  setScope: (scope) => set({ scope }),
  reset: () => set({ activeTab: null, query: '', scope: 'current' }),
}));
