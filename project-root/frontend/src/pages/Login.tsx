import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      const error = err as { code?: string; message?: string };
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        setError('Сервер недоступен. Используйте демо-режим или запустите бэкенд.');
      } else {
        setError('Неверный логин или пароль');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    loginDemo();
    navigate('/dashboard');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: 'linear-gradient(135deg, var(--iris-dark) 0%, var(--iris-primary) 100%)',
        fontFamily: 'var(--font-body)'
      }}
    >
      {/* Декоративные элементы — лепестки ириса */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 opacity-10 rotate-12" 
             style={{ background: 'var(--iris-accent)', borderRadius: '60% 40% 30% 70%' }} />
        <div className="absolute bottom-20 right-20 w-48 h-48 opacity-10 -rotate-12" 
             style={{ background: 'var(--iris-success)', borderRadius: '40% 60% 70% 30%' }} />
      </div>

      <div 
        className="relative w-full max-w-md rounded-2xl p-8 shadow-lg"
        style={{ 
          backgroundColor: 'var(--iris-surface)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--iris-border)'
        }}
      >
        {/* Логотип ДокПоток IRIS */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <img 
            src="/лого ДокПоток IRIS.png" 
            alt="ДокПоток IRIS" 
            className="h-16 w-auto"
          />
          <div className="text-center">
            <h1 
              className="text-2xl font-bold tracking-tight"
              style={{ 
                fontFamily: 'var(--font-heading)', 
                color: 'var(--iris-dark)' 
              }}
            >
              ДокПоток <span style={{ color: 'var(--iris-primary)' }}>IRIS</span>
            </h1>
            <p 
              className="mt-1 text-sm"
              style={{ color: 'var(--iris-text-muted)' }}
            >
              Система управления инженерной документацией
            </p>
          </div>
        </div>

        {/* Слоган */}
        <p 
          className="text-center text-sm mb-6 italic"
          style={{ color: 'var(--iris-accent)' }}
        >
          От чертежа до согласования за один поток
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div 
              className="px-4 py-3 rounded-lg text-sm flex items-center gap-2"
              style={{ 
                backgroundColor: '#FDEDEC', 
                color: 'var(--iris-error)',
                border: '1px solid var(--iris-error)'
              }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--iris-text)' }}
            >
              Email / Логин
            </label>
            <input
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg outline-none transition-all duration-150"
              style={{ 
                backgroundColor: 'var(--iris-bg)',
                border: '1px solid var(--iris-border)',
                color: 'var(--iris-text)'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--iris-primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--iris-border)'}
              placeholder="admin" 
              required
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-1"
              style={{ color: 'var(--iris-text)' }}
            >
              Пароль
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg outline-none transition-all duration-150 pr-10"
                style={{ 
                  backgroundColor: 'var(--iris-bg)',
                  border: '1px solid var(--iris-border)',
                  color: 'var(--iris-text)'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--iris-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--iris-border)'}
                placeholder="••••••" 
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--iris-text-muted)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 mt-2"
            style={{ 
              backgroundColor: 'var(--iris-primary)',
              color: 'white'
            }}
            onMouseEnter={e => !loading && (e.currentTarget.style.backgroundColor = 'var(--iris-primary-hover)')}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--iris-primary)'}
          >
            {loading ? 'Вход...' : 'Войти в систему'}
          </button>
        </form>

        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--iris-border)' }}>
          <button
            onClick={handleDemo}
            className="w-full py-2.5 rounded-lg font-medium transition-all duration-150 text-sm"
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--iris-primary)',
              border: '1px solid var(--iris-primary)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 79, 168, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Демо-режим (без сервера)
          </button>
          <p 
            className="mt-3 text-xs text-center"
            style={{ color: 'var(--iris-text-muted)' }}
          >
            Тестовый вход: <span style={{ color: 'var(--iris-text)' }}>test@example.com</span> / <span style={{ color: 'var(--iris-text)' }}>test123</span>
          </p>
        </div>
      </div>
    </div>
  );
}