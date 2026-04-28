// frontend/src/app/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export const ProtectedRoute: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  // Fallback: если в localStorage есть токен, считаем авторизованным даже до гидратации
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token');
  const isAuth = isAuthenticated || hasToken;

  // Ждём гидратацию Zustand persist перед редиректом (но не блокируем если есть токен)
  if (!hasHydrated && !hasToken) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--layout-bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};
