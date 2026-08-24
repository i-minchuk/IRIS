import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api/authApi';
import { authEvents } from '@/shared/api/authEvents';

import type { UserRole } from '@/features/auth/store/authStore';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  username: string;
  role: UserRole;
  is_active: boolean;
  totp_enabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(raw: unknown): User {
  const r = raw as Record<string, unknown>;
  const email = String(r?.email ?? '');
  return {
    id: Number(r?.id ?? 0),
    email,
    full_name: (r?.full_name as string | null) ?? null,
    username: (r?.username as string | undefined) ?? email.split('@')[0],
    role: ((r?.role as string | undefined) ?? 'engineer') as UserRole,
    is_active: Boolean(r?.is_active ?? true),
    totp_enabled: Boolean(r?.totp_enabled ?? false),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const storeUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isDemoMode = useAuthStore((state) => state.isDemoMode);
  const setAuth = useAuthStore((state) => state.setAuth);
  const storeLogout = useAuthStore((state) => state.logout);

  // Subscribe to logout events from apiClient
  useEffect(() => {
    const unsubscribe = authEvents.onLogout(() => {
      storeLogout();
    });
    return unsubscribe;
  }, [storeLogout]);

  useEffect(() => {
    let mounted = true;
    const restore = async () => {
      try {
        const currentUser = await authApi.getCurrentUser();
        if (!mounted) return;
        const token = useAuthStore.getState().token || '';
        setAuth(normalizeUser(currentUser), token || 'restored');
      } catch {
        if (mounted) storeLogout();
      } finally {
        if (mounted) setLoading(false);
      }
    };
    restore();
    return () => {
      mounted = false;
    };
  }, [setAuth, storeLogout, isDemoMode]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      // Бэкенд ищет либо по email, либо по username — выбираем поле по наличию '@'
      const credentials = usernameOrEmail.includes('@')
        ? { email: usernameOrEmail, password }
        : { username: usernameOrEmail, password };
      const tokenResponse = await authApi.login(credentials);
      // Сохраняем токен ДО вызова getCurrentUser, чтобы apiClient подставил Authorization header
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      const currentUser = await authApi.getCurrentUser();
      setAuth(normalizeUser(currentUser), tokenResponse.access_token);
    },
    [setAuth]
  );

  const loginDemo = useCallback(async () => {
    await useAuthStore.getState().enableDemo();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    storeLogout();
  }, [storeLogout]);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      const token = useAuthStore.getState().token || '';
      setAuth(normalizeUser(currentUser), token || 'restored');
    } catch {
      storeLogout();
    }
  }, [setAuth, storeLogout]);

  const user = storeUser ? normalizeUser(storeUser) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        loginDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
