import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { ArrowLeft, Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useZoomStore } from '@/features/zoom/store/zoomStore';
import { authApi } from '@/features/auth/api/authApi';

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  const { setHidden } = useZoomStore();
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Отсутствует токен сброса пароля. Проверьте ссылку из письма.');
    }
  }, [token]);

  const validate = (): boolean => {
    setError('');
    if (!token) {
      setError('Отсутствует токен сброса пароля.');
      return false;
    }
    if (!newPassword) {
      setError('Введите новый пароль.');
      return false;
    }
    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов.');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка сброса пароля. Попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBg = isDark ? '#1A1F2E' : '#FFFFFF';
  const inputBorder = isDark ? '#3D4554' : '#CED2DD';
  const textMain = isDark ? '#E2E5EC' : '#1E2230';
  const textMuted = isDark ? '#8B92A8' : '#6B7280';
  const iconColor = isDark ? '#5A6270' : '#A0A8B8';
  const cardBg = isDark ? '#151B38' : '#FFFFFF';
  const cardBorder = isDark ? '#3D4554' : '#CED2DD';
  const accent = isDark ? '#5C75E0' : '#3B4FA8';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: isDark ? '#0D1117' : '#F5F6FA' }}>
      <div className="fixed top-0 left-0 right-0 h-[3px] z-[1000]" style={{ background: accent, boxShadow: isDark ? '0 0 10px rgba(92,117,224,0.6)' : '0 0 10px rgba(59,79,168,0.6)' }} />
      <div className="fixed pointer-events-none" style={{ top: '-50%', left: '-50%', width: '200%', height: '200%', background: isDark ? 'radial-gradient(ellipse at center, rgba(92,117,224,0.1) 0%, transparent 60%)' : 'radial-gradient(ellipse at center, rgba(59,79,168,0.08) 0%, transparent 60%)', zIndex: -1 }} />

      <header className="h-16 flex items-center justify-between px-8 relative z-[100]" style={{ background: cardBg, borderBottom: `1px solid ${cardBorder}` }}>
        <Link to="/" className="flex items-center gap-1.5 text-[13px]" style={{ color: textMuted }}>
          <ArrowLeft size={16} /> Назад
        </Link>
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 36 36">
            <rect x="3" y="3" width="30" height="30" rx="6" fill={accent} />
            <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
            <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
            <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
            <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
          </svg>
          <span className="text-lg font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: textMain }}>
            ДокПоток <span className="text-xs font-bold px-2 py-0.5 rounded ml-1" style={{ background: accent, color: '#fff' }}>IRIS</span>
          </span>
        </div>
        <div className="w-20" />
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px] p-10 rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: isDark ? '#1A1F2E' : '#EBF5FB' }}>
            <svg width="48" height="48" viewBox="0 0 36 36">
              <rect x="3" y="3" width="30" height="30" rx="6" fill={accent} />
              <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
              <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
              <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
              <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-center mb-1" style={{ color: textMain }}>Новый пароль</h2>
          <p className="text-[13px] text-center mb-7" style={{ color: textMuted }}>Придумайте новый пароль для аккаунта</p>

          {error && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-md mb-4 text-xs" style={{ background: '#FDEDEC', color: '#C0392B' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="new_password" className="block text-sm font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Новый пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }} />
                <input id="new_password" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Минимум 6 символов" autoComplete="new-password" required minLength={6}
                  className="w-full h-11 pl-10 pr-10 rounded-lg text-sm outline-none"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textMain }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer" style={{ color: iconColor }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="mb-5">
              <label htmlFor="confirm_password" className="block text-sm font-semibold uppercase tracking-wider mb-1.5" style={{ color: textMuted }}>Подтвердите пароль</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: iconColor }} />
                <input id="confirm_password" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Повторите пароль" autoComplete="new-password" required
                  className="w-full h-11 pl-10 pr-10 rounded-lg text-sm outline-none"
                  style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textMain }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer" style={{ color: iconColor }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading || !token}
              className="w-full h-11 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: accent, opacity: isLoading || !token ? 0.7 : 1, cursor: isLoading || !token ? 'wait' : 'pointer' }}>
              {isLoading ? <span className="animate-spin">⟳</span> : <>Сохранить пароль <KeyRound size={16} /></>}
            </button>
          </form>

          <p className="text-center text-[13px] mt-5" style={{ color: textMuted }}>
            <Link to="/login" className="font-semibold hover:underline" style={{ color: accent }}>Вернуться ко входу</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
