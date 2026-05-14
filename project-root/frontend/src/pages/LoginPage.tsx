import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { Eye, EyeOff, ArrowLeft, LogIn, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard', { replace: true });
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: isDark ? '#0D1117' : '#F5F6FA' }}>
      
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[1000]"
        style={{ background: isDark ? '#5C75E0' : '#3B4FA8',
          boxShadow: isDark ? '0 0 10px rgba(92,117,224,0.6)' : '0 0 10px rgba(59,79,168,0.6)' }} />
      
      <div className="fixed pointer-events-none"
        style={{ top: '-50%', left: '-50%', width: '200%', height: '200%',
          background: isDark ? 'radial-gradient(ellipse at center, rgba(92,117,224,0.1) 0%, transparent 60%)' : 'radial-gradient(ellipse at center, rgba(59,79,168,0.08) 0%, transparent 60%)',
          zIndex: -1 }} />

      <header className="h-16 flex items-center justify-between px-8 relative z-[100]"
        style={{ background: isDark ? '#151B38' : '#FFFFFF', borderBottom: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}` }}>
        <Link to="/" className="flex items-center gap-1.5 text-[13px]" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>
          <ArrowLeft size={16} /> Назад
        </Link>
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 36 36">
            <rect x="3" y="3" width="30" height="30" rx="6" fill={isDark ? '#5C75E0' : '#3B4FA8'} />
            <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
            <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
            <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
            <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
          </svg>
          <span className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: isDark ? '#E2E5EC' : '#1E2230' }}>
            ДокПоток <span className="text-xs font-bold px-2 py-0.5 rounded ml-1" style={{ background: isDark ? '#5C75E0' : '#3B4FA8', color: '#fff' }}>IRIS</span>
          </span>
        </div>
        <div className="w-20" />
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px] p-10 rounded-2xl"
          style={{ background: isDark ? '#151B38' : '#FFFFFF', border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}` }}>
          
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: isDark ? '#1A1F2E' : '#EBF5FB' }}>
            <svg width="48" height="48" viewBox="0 0 36 36">
              <rect x="3" y="3" width="30" height="30" rx="6" fill={isDark ? '#5C75E0' : '#3B4FA8'} />
              <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
              <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
              <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
              <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-center mb-1" style={{ color: isDark ? '#E2E5EC' : '#1E2230' }}>Авторизация</h2>
          <p className="text-[13px] text-center mb-7" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Войдите в систему ДокПоток IRIS</p>

          {error && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: '#FDEDEC', color: '#C0392B' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label htmlFor="login" className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Логин</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#5A6270' : '#A0A8B8' }} />
                <input id="login" type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Введите логин" autoComplete="username"
                  className="w-full h-11 pl-10 pr-3 rounded-lg text-sm outline-none"
                  style={{ background: isDark ? '#1A1F2E' : '#FFFFFF', border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`, color: isDark ? '#E2E5EC' : '#1E2230' }} />
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#5A6270' : '#A0A8B8' }} />
                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Введите пароль" autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-10 rounded-lg text-sm outline-none"
                  style={{ background: isDark ? '#1A1F2E' : '#FFFFFF', border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`, color: isDark ? '#E2E5EC' : '#1E2230' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer" style={{ color: isDark ? '#5A6270' : '#A0A8B8' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full h-11 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: isDark ? '#5C75E0' : '#3B4FA8', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}>
              {isLoading ? <span className="animate-spin">⟳</span> : <>Войти <LogIn size={16} /></>}
            </button>
          </form>

          <p className="text-center text-[11px] mt-4" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>Демо: любой логин и пароль</p>
        </div>
      </div>
    </div>
  );
}