import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, applyThemeToDOM } from '@/providers/ThemeProvider';
import type { Theme } from '@/providers/ThemeProvider';
import { Eye, EyeOff, ArrowLeft, LogIn, User, Lock, Shield } from 'lucide-react';
import { useZoomStore } from '@/features/zoom/store/zoomStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMeta } from '@/shared/api/meta';
import { useAuth } from '@/context/useAuth';
import { ChromeBot } from '@/components/ChromeBot';


export default function LoginPage() {
  const { theme } = useTheme();
  // На странице логина только две темы: светлая и тёмная.
  // sepia/midnight/contrast здесь не применяются: пока страница смонтирована,
  // на <html> выставляется light/dark, при уходе восстанавливается тема пользователя.
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  useEffect(() => {
    const saved = localStorage.getItem('iris-theme');
    applyThemeToDOM(isDark ? 'dark' : 'light');
    return () => {
      const restore: Theme =
        saved === 'dark' || saved === 'contrast' || saved === 'sepia' || saved === 'midnight'
          ? saved
          : 'light';
      applyThemeToDOM(restore);
    };
  }, [isDark]);
  const { setHidden } = useZoomStore();
  useEffect(() => {
    setHidden(true);              // скрыть зум на странице логина
    return () => setHidden(false); // показать зум при уходе
  }, [setHidden]);
  const navigate = useNavigate();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login: doLogin } = useAuth();
  const enableDemo = useAuthStore((state) => state.enableDemo);
  const [demoAvailable, setDemoAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMeta()
      .then(({ data }) => { if (!cancelled) setDemoAvailable(data.mode === 'demo'); })
      .catch(() => { if (!cancelled) setDemoAvailable(false); });
    return () => { cancelled = true; };
  }, []);

  const handleDemo = async () => {
    setError('');
    setIsLoading(true);
    try {
      await enableDemo();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Демо-вход недоступен. Проверьте, что сервер запущен в режиме demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginValue.trim() || !password.trim()) {
      setError('Введите логин и пароль.');
      return;
    }
    if (loginValue.trim().length < 3) {
      setError('Логин должен содержать минимум 3 символа.');
      return;
    }
    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.');
      return;
    }

    setIsLoading(true);

    try {
      await doLogin(loginValue.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа. Проверьте соединение с сервером.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden" style={{ background: isDark ? '#0D1117' : '#F5F6FA' }}>
      
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[1000]"
        style={{ background: isDark ? '#5C75E0' : '#3B4FA8',
          boxShadow: isDark ? '0 0 10px rgba(92,117,224,0.6)' : '0 0 10px rgba(59,79,168,0.6)' }} />
      
      <div className="fixed pointer-events-none"
        style={{ top: '-50%', left: '-50%', width: '200%', height: '200%',
          background: isDark ? 'radial-gradient(ellipse at center, rgba(92,117,224,0.1) 0%, transparent 60%)' : 'radial-gradient(ellipse at center, rgba(59,79,168,0.08) 0%, transparent 60%)',
          zIndex: -1 }} />

      <header className="h-14 flex items-center justify-between px-4 sm:px-6 relative z-[100] shrink-0"
        style={{ background: isDark ? '#151B38' : '#FFFFFF', borderBottom: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}` }}>
        <Link to="/" className="flex items-center gap-1.5 text-[13px]" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>
          <ArrowLeft size={16} /> Назад
        </Link>
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 36 36">
            <rect x="3" y="3" width="30" height="30" rx="6" fill={isDark ? '#5C75E0' : '#3B4FA8'} />
            <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
            <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
            <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
            <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
          </svg>
          <span className="text-base font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: isDark ? '#E2E5EC' : '#1E2230' }}>
            ДокПоток <span className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-1" style={{ background: isDark ? '#5C75E0' : '#3B4FA8', color: '#fff' }}>IRIS</span>
          </span>
        </div>
        <div className="w-16" />
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-2 overflow-hidden">
        <div className="w-full max-w-[380px] p-5 sm:p-6 rounded-xl"
          style={{ background: isDark ? '#151B38' : '#FFFFFF', border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}` }}>
          
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-2">
            <ChromeBot size={96} variant={isDark ? 'dark' : 'light'} />
          </div>

          <h2 className="text-lg font-bold text-center mb-0.5" style={{ color: isDark ? '#E2E5EC' : '#1E2230' }}>Авторизация</h2>
          <p className="text-[13px] text-center mb-3" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Войдите в систему ДокПоток IRIS</p>

          {error && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md mb-3 text-xs" style={{ background: '#FDEDEC', color: '#C0392B' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="login" className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Логин</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#5A6270' : '#A0A8B8' }} />
                <input id="login" type="text" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} placeholder="Введите логин" autoComplete="username" required minLength={3}
                  className="w-full h-9 pl-10 pr-3 rounded-lg text-sm outline-none"
                  style={{ background: isDark ? '#1A1F2E' : '#FFFFFF', border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`, color: isDark ? '#E2E5EC' : '#1E2230' }} />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#5A6270' : '#A0A8B8' }} />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password" required minLength={6}
                  className="w-full h-9 pl-10 pr-10 rounded-lg text-sm outline-none"
                  style={{ background: isDark ? '#1A1F2E' : '#FFFFFF', border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`, color: isDark ? '#E2E5EC' : '#1E2230' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer" style={{ color: isDark ? '#5A6270' : '#A0A8B8' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full h-9 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: isDark ? '#5C75E0' : '#3B4FA8', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}>
              {isLoading ? <span className="animate-spin">⟳</span> : <>Войти <LogIn size={16} /></>}
            </button>
          </form>

          <div className="flex items-center justify-end mt-3">
            <Link to="/forgot-password" className="text-[13px] hover:underline" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Забыли пароль?</Link>
          </div>

          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}` }}>
            <a
              href="/api/v1/auth/saml/login"
              className="w-full h-9 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mb-2"
              style={{
                background: isDark ? '#1A1F2E' : '#F5F6FA',
                color: isDark ? '#E2E5EC' : '#1E2230',
                border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`,
              }}
            >
              <Shield size={16} /> Войти через SSO
            </a>
            {demoAvailable && (
              <button
                onClick={handleDemo}
                disabled={isLoading}
                className="w-full h-9 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
                style={{
                  background: isDark ? 'rgba(12,114,5,0.2)' : 'rgba(12,114,5,0.1)',
                  color: '#0C7205',
                  border: `1px solid ${isDark ? 'rgba(12,114,5,0.4)' : 'rgba(12,114,5,0.3)'}`,
                }}
              >
                🚀 Демо-режим
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
