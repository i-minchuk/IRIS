import { useEffect, useState, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const [checking, setChecking] = useState(true);
  const checkStarted = useRef(false);

  useEffect(() => {
    // Prevent double-check in StrictMode
    if (checkStarted.current) return;
    checkStarted.current = true;

    let mounted = true;

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
      await checkAuth();
      if (mounted) setChecking(false);
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [checkAuth, user, isAuthenticated]);

  // Пока проверяем авторизацию — показываем заглушку
  if (checking || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400 text-sm">
        Загрузка…
      </div>
    );
  }

  // Нет токена или пользователь не загружен — редирект на login
  const token = localStorage.getItem('access_token');
  if (!token || !user || !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Проверка ролей
  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
