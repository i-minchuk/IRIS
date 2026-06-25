import { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const AUTH_CHECK_TIMEOUT = 5000; // 5 seconds max wait

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const [checking, setChecking] = useState(true);
  const [checkTimedOut, setCheckTimedOut] = useState(false);
  const checkStarted = useRef(false);

  useEffect(() => {
    // Prevent double-check in StrictMode
    if (checkStarted.current) return;
    checkStarted.current = true;

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    const verify = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        if (mounted) setChecking(false);
        return;
      }
      // Если пользователь уже загружен — не делаем лишний запрос
      if (user && isAuthenticated) {
        if (mounted) setChecking(false);
        return;
      }

      // Set timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted) {
          setCheckTimedOut(true);
          setChecking(false);
        }
      }, AUTH_CHECK_TIMEOUT);

      try {
        await checkAuth();
      } catch {
        // checkAuth failed — will set isAuthenticated to false
      } finally {
        clearTimeout(timeoutId);
        if (mounted) setChecking(false);
      }
    };

    verify();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [checkAuth, user, isAuthenticated]);

  // Пока проверяем авторизацию — показываем заглушку
  if (checking || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ color: 'var(--text-muted)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Загрузка…</span>
          {checkTimedOut && (
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Проверка занимает больше времени обычного…
            </span>
          )}
        </div>
      </div>
    );
  }

  // Нет токена — редирект на login
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Есть токен, но пользователь не загружен (checkAuth упал) — редирект на login
  if (!user || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Проверка ролей
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
