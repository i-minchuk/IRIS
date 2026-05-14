// frontend/src/features/auth/store/authStore.ts
import { create } from 'zustand';
import { authApi } from '../api/authApi';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasHydrated: true, // сразу true, т.к. нет persist

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const user = await authApi.getCurrentUser();
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
