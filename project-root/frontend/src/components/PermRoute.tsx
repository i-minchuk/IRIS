import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCan } from '@/shared/hooks/useCan';

interface PermRouteProps {
  /** Требуемое право (см. app/core/permissions.py). */
  perm: string;
  children: ReactNode;
}

/**
 * Guard страницы по праву RBAC (этап 4 P1).
 * admin и '*' проходят всегда; если права ещё не загружены — пропускаем
 * (фолбэк allow, как в useCan): бэкенд всё равно отсечёт запрещённое.
 * Нет права — редирект на дашборд.
 */
export function PermRoute({ perm, children }: PermRouteProps) {
  const allowed = useCan(perm);
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
