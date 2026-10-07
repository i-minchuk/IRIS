import { useAuth } from '@/context/useAuth';

/**
 * Проверка права доступа текущего пользователя (RBAC, этап 2–3).
 *
 * - admin и '*' — разрешено всё;
 * - права ещё не загружены (permissions undefined) — не скрываем UI (фолбэк allow),
 *   бэкенд всё равно отсечёт запрещённые действия;
 * - иначе — наличие конкретного права в списке permissions из /auth/me.
 */
export function useCan(permission: string): boolean {
  const { user } = useAuth();
  if (!user) return false;
  if (user.role === 'admin') return true;
  const perms = user.permissions;
  if (!perms) return true;
  return perms.includes('*') || perms.includes(permission);
}
