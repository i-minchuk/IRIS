// frontend/src/lib/useCan.ts
// Проверка эффективных прав доступа текущего пользователя (RBAC).
// Набор прав приходит с бэкенда в /auth/me (поле permissions, '*' = полный доступ).
import { useAuth } from '@/context/useAuth';

export function useCan(): (permission: string) => boolean {
  const { user } = useAuth();
  const permissions = user?.permissions;
  return (permission: string) =>
    !!permissions && (permissions.includes('*') || permissions.includes(permission));
}
