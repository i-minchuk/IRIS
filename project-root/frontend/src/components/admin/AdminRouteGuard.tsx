import { useEffect, useState, useRef, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AdminRoleCode } from '@/types/admin';

const ADMIN_ROLES: AdminRoleCode[] = ['product_owner', 'system_admin', 'tech_support', 'content_editor', 'admin'];

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [checking, setChecking] = useState(true);
  const checkStarted = useRef(false);

  useEffect(() => {
    if (checkStarted.current) return;
    checkStarted.current = true;

    let mounted = true;
    const verify = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        if (mounted) setChecking(false);
        return;
      }
      if (user && isAuthenticated) {
        if (mounted) setChecking(false);
        return;
      }
      await checkAuth();
      if (mounted) setChecking(false);
    };
    verify();
    return () => { mounted = false; };
  }, [checkAuth, user, isAuthenticated]);

  // Пока проверяем — показываем заглушку
  if (checking) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        Загрузка…
      </div>
    );
  }

  // После проверки — если нет прав, редирект
  if (!user || !ADMIN_ROLES.includes(user.role as AdminRoleCode)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
