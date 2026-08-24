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

// Демо-вход выполняется реальным логином посеянного пользователя
// (создаётся автоматически при MODE=demo на backend, см. app/db/demo_seed.py)
export const DEMO_CREDENTIALS = { email: 'demo@iris.local', password: 'demo1234' };

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
  enableDemo: () => Promise<void>;
  disableDemo: () => void;
}

function isDemoEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('demo_mode') === '1';
}

function getInitialState(): Pick<AuthState, 'user' | 'token' | 'isAuthenticated' | 'isLoading' | 'hasHydrated' | 'isDemoMode'> {
  // Try to restore token from localStorage on init (hydration)
  const token = localStorage.getItem('access_token');
  if (token) {
    return {
      user: null, // will be filled by checkAuth
      token,
      isAuthenticated: true, // optimistic: assume valid until checkAuth confirms
      isLoading: true, // show loading while validating
      hasHydrated: true,
      isDemoMode: isDemoEnabled(),
    };
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    hasHydrated: true,
    isDemoMode: false,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),

  setAuth: (user, token) => {
    localStorage.setItem('access_token', token);
    set({ user, token, isAuthenticated: true, isLoading: false });
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
      set({ user, token, isAuthenticated: true, isLoading: false, isDemoMode: isDemoEnabled() });
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Токен невалиден — завершаем сессию
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('demo_mode');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, isDemoMode: false });
      } else {
        // Транзиентная ошибка (429, сеть, 5xx) — не разлогиниваем пользователя
        set({ isLoading: false });
      }
    }
  },

  enableDemo: async () => {
    // Реальный логин демо-пользователем (требует backend с MODE=demo)
    const tokenResponse = await authApi.login({
      email: DEMO_CREDENTIALS.email,
      password: DEMO_CREDENTIALS.password,
    });
    localStorage.setItem('access_token', tokenResponse.access_token);
    localStorage.setItem('refresh_token', tokenResponse.refresh_token);
    localStorage.setItem('demo_mode', '1');
    const apiUser = await authApi.getCurrentUser();
    const user: User = {
      id: apiUser.id,
      email: apiUser.email,
      full_name: apiUser.full_name,
      role: apiUser.role as UserRole,
      is_active: apiUser.is_active,
    };
    set({
      user,
      token: tokenResponse.access_token,
      isAuthenticated: true,
      isLoading: false,
      isDemoMode: true,
    });
  },

  disableDemo: () => {
    localStorage.removeItem('demo_mode');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false, isDemoMode: false });
  },
}));

// Subscribe to logout events from apiClient (breaks circular dependency)
authEvents.onLogout(() => {
  useAuthStore.getState().logout();
});
