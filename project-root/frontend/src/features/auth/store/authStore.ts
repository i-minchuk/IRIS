// frontend/src/features/auth/store/authStore.ts
import { create } from 'zustand';
import { authApi } from '../api/authApi';
import { authEvents } from '@/shared/api/authEvents';

export type UserRole = 'director' | 'deputy_director' | 'department_head' | 'gip' | 'site_manager' | 'engineer' | 'manager' | 'norm_controller' | 'admin';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
}

const DEMO_USER: User = {
  id: 1,
  email: 'demo@dokpotok.ru',
  full_name: 'Демо Пользователь',
  role: 'admin',
  is_active: true,
};

const DEMO_TOKEN = 'demo-token-iris-2026';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  isDemoMode: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  checkAuth: () => Promise<void>;
  enableDemo: () => void;
  disableDemo: () => void;
}

function isDemoEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('demo_mode') === '1' || (window as any).__DEMO_MODE__ === true;
}

function getInitialState(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated' | 'isLoading' | 'hasHydrated' | 'isDemoMode'> {
  const demo = isDemoEnabled();
  return {
    user: demo ? DEMO_USER : null,
    token: demo ? DEMO_TOKEN : null,
    isAuthenticated: demo,
    isLoading: false,
    hasHydrated: true,
    isDemoMode: demo,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true, isLoading: false, isDemoMode: false });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('demo_mode');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, isDemoMode: false });
  },

  setLoading: (isLoading) => set({ isLoading }),

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),

  checkAuth: async () => {
    // Demo mode: skip backend validation
    if (isDemoEnabled()) {
      set({ user: DEMO_USER, token: DEMO_TOKEN, isAuthenticated: true, isLoading: false, isDemoMode: true });
      return;
    }

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
      set({ user, token, isAuthenticated: true, isLoading: false, isDemoMode: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isDemoMode: false });
    }
  },

  enableDemo: () => {
    localStorage.setItem('demo_mode', '1');
    localStorage.setItem('access_token', DEMO_TOKEN);
    set({ user: DEMO_USER, token: DEMO_TOKEN, isAuthenticated: true, isLoading: false, isDemoMode: true });
  },

  disableDemo: () => {
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('access_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, isDemoMode: false });
  },
}));

// Subscribe to logout events from apiClient (breaks circular dependency)
authEvents.onLogout(() => {
  useAuthStore.getState().logout();
});
