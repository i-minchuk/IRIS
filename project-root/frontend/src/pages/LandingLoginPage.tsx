import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/features/auth/api/authApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { FlowIcon, ApprovalIcon, VersionIcon, SpeedIcon } from '@/shared/components/icons/LandingIcons';
import { LogIn, ChevronDown, Eye, EyeOff } from 'lucide-react';

export function LandingLoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const loginRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('admin@iris.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <div className="min-h-screen w-full" style={{
      background: 'linear-gradient(135deg, #1E2230 0%, #2D3748 25%, #4F7A4C 60%, #8B9DAF 100%)'
    }}>
      {/* HERO */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center border border-white/20">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="8" width="32" height="32" rx="8" fill="#4F7A4C" opacity="0.9"/>
              <path d="M16 20H32M16 26H28M16 32H24" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="34" cy="34" r="8" fill="#1E2230" stroke="white" strokeWidth="2"/>
              <path d="M31 34L33 36L37 32" stroke="#4F7A4C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
            ДокПоток <span className="text-[#8B9DAF]">IRIS</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-2">
            От чертежа до согласования за один поток
          </p>
          <p className="text-sm text-white/60 mb-8">
            Система управления инженерной документацией
          </p>

          <button
            onClick={scrollToLogin}
            className="px-8 py-3 bg-[#4F7A4C] hover:bg-[#3d6139] text-white rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            <LogIn size={20} />
            Войти в систему
          </button>
        </div>
        <div className="absolute bottom-8 animate-bounce text-white/50">
          <ChevronDown size={32} />
        </div>
      </div>

      {/* FEATURES */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Возможности системы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard icon={<FlowIcon />} title="Единый поток" description="Все документы проекта в одном месте. Чертежи, спецификации, отчеты." />
            <FeatureCard icon={<ApprovalIcon />} title="Согласования" description="Прозрачные маршруты согласования. Всегда видно, кто проверяет документ." />
            <FeatureCard icon={<VersionIcon />} title="Контроль версий" description="Ничего не теряется. Полная история изменений каждого документа." />
            <FeatureCard icon={<SpeedIcon />} title="Скорость" description="От чертежа до подписи. Автоматические уведомления и напоминания." />
          </div>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div ref={loginRef} className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#1E2230]">Вход в систему</h2>
              <p className="text-sm text-[#64748B] mt-1">ДокПоток IRIS</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E2230] mb-1.5">Email адрес</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F7A4C] text-[#1E2230]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E2230] mb-1.5">Пароль</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4F7A4C] text-[#1E2230] pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#4F7A4C] hover:bg-[#3d6139] text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={18} /> Войти</>}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#E2E8F0] text-center">
              <p className="text-xs text-[#94A3B8] mb-1">Тестовый вход:</p>
              <p className="text-xs text-[#64748B]">Email: admin@iris.local</p>
              <p className="text-xs text-[#64748B]">Пароль: admin123</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-8 text-center text-white/40 text-sm">© 2026 ДокПоток IRIS. Все права защищены.</div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 hover:scale-105 transition-transform duration-300">
      <div className="w-14 h-14 bg-gradient-to-br from-[#4F7A4C]/20 to-[#8B9DAF]/20 rounded-xl flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-[#1E2230] mb-2">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  );
}
