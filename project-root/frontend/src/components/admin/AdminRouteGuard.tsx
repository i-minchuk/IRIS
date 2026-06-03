import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { AdminRoleCode } from '@/types/admin';

const ADMIN_ROLES: AdminRoleCode[] = ['product_owner', 'system_admin', 'tech_support', 'content_editor', 'admin'];

export function AdminRouteGuard() {
  const user = useAuthStore((state) => state.user);

  if (!user || !ADMIN_ROLES.includes(user.role as AdminRoleCode)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
