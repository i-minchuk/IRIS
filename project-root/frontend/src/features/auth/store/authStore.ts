// frontend/src/features/auth/store/authStore.ts
import { create } from 'zustand';
import { authApi } from '../api/authApi';

export type UserRole = 'director' | 'deputy_director' | 'department_head' | 'gip' | 'site_manager' | 'engineer' | 'manager' | 'norm_controller' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
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
    // Token is stored in HttpOnly cookie by backend; keep localStorage as fallback
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
      const apiUser = await authApi.getCurrentUser();
      const user: User = {
        id: apiUser.id,
        email: apiUser.email,
        full_name: apiUser.full_name,
        role: apiUser.role as UserRole,
        is_active: apiUser.is_active,
      };
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
