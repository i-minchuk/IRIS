import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/authStore';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('admin@iris.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tokenResponse = await authApi.login({ email, password });
      localStorage.setItem('access_token', tokenResponse.access_token);
      localStorage.setItem('refresh_token', tokenResponse.refresh_token);
      const user = await authApi.getCurrentUser();
      setAuth(user, tokenResponse.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 etalon-bg">
      {/* SVG Логотип */}
      <svg
        width="140"
        height="170"
        viewBox="0 0 200 240"
        fill="none"
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))', marginBottom: '1.5rem' }}
      >
        <rect x="25" y="10" width="150" height="190" rx="14" fill="#FFFFFF" />
        <path d="M135 10 L175 10 L175 50 Q175 10 135 10 Z" fill="#9B8EC7" />
        <path d="M135 10 L175 50 Q140 50 135 10 Z" fill="#6B5B95" />
        <rect x="50" y="70" width="100" height="10" rx="5" fill="#D4AF37" />
        <rect x="50" y="95" width="80" height="10" rx="5" fill="#D4AF37" />
        <rect x="50" y="120" width="90" height="10" rx="5" fill="#D4AF37" />
        <circle cx="55" cy="195" r="28" fill="#6B5B95" />
        <circle cx="55" cy="195" r="18" fill="#D4AF37" />
        <circle cx="55" cy="195" r="8" fill="#FFFFFF" opacity="0.3" />
      </svg>

      {/* Слоган */}
      <h1 className="text-center text-2xl sm:text-3xl font-semibold text-white mb-2">
        От чертежа до согласования
        <br />
        за один поток
      </h1>

      {/* Авторизация */}
      <h2 className="text-center text-lg mb-1" style={{ color: '#94A3B8' }}>
        Авторизация
      </h2>
      <p className="text-center text-sm mb-8" style={{ color: '#64748B' }}>
        Войдите в систему ДокПоток IRIS
      </p>

      {/* Стеклянная форма */}
      <div className="w-full max-w-sm p-8 etalon-glass">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#E2E8F0' }}>
              Логин
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите логин"
              className="etalon-input"
            />
          </div>

          <div>
            <label className="block text-sm mb-1.5" style={{ color: '#E2E8F0' }}>
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="etalon-input"
            />
          </div>

          {error && (
            <div
              className="rounded-lg px-4 py-2.5 text-sm"
              style={{
                background: 'rgba(215, 58, 58, 0.15)',
                border: '1px solid rgba(215, 58, 58, 0.3)',
                color: '#FF6B6B',
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="etalon-btn">
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>

      {/* Демо-примечание */}
      <p className="mt-6 text-center text-xs" style={{ color: '#64748B' }}>
        Демо: любой логин и пароль
      </p>
    </div>
  );
}
