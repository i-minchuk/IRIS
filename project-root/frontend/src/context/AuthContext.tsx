import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { authApi } from '@/features/auth/api/authApi';

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  username: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
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
    role: (r?.role as string | undefined) ?? 'engineer',
    is_active: Boolean(r?.is_active ?? true),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const storeUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);
  const storeLogout = useAuthStore((state) => state.logout);

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
  }, [setAuth, storeLogout]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokenResponse = await authApi.login({ email, password });
      const currentUser = await authApi.getCurrentUser();
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      setAuth(normalizeUser(currentUser), tokenResponse.access_token);
    },
    [setAuth]
  );

  const loginDemo = useCallback(async () => {
    const demoUser: User = {
      id: 1,
      email: 'demo@stdo.local',
      full_name: 'Demo User',
      username: 'demo',
      role: 'admin',
      is_active: true,
    };
    setAuth(demoUser, 'demo-token');
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    storeLogout();
  }, [storeLogout]);

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
