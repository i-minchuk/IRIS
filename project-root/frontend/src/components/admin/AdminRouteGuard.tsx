import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AdminRoleCode } from '@/types/admin';

const ADMIN_ROLES: AdminRoleCode[] = ['product_owner', 'system_admin', 'tech_support', 'content_editor', 'admin'];

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const user = useAuthStore((state) => state.user);

  // Синхронная проверка — ProtectedRoute уже гарантирует аутентификацию
  if (!user || !ADMIN_ROLES.includes(user.role as AdminRoleCode)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
