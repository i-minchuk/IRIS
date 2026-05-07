import { useNavigate } from 'react-router-dom';
import { FileText, GitBranch, Shield, Zap, ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full" style={{ background: '#f0f2f5' }}>
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Логотип */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="relative w-12 h-12">
            <div className="w-12 h-12 bg-[#1e3a8a] rounded-xl flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="6" y="4" width="16" height="20" rx="2" fill="white"/>
                <path d="M10 10H18M10 14H16M10 18H14" stroke="#1e3a8a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-[#f59e0b] rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">✓</span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#1e2230]">ДокПоток</span>
            <span className="text-sm font-bold px-2 py-0.5 rounded bg-[#3b82f6] text-white">IRIS</span>
          </div>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1e2230] mb-2">
            От чертежа до согласования
          </h1>
          <p className="text-4xl md:text-5xl font-bold text-[#3b82f6] mb-4">
            за один поток
          </p>
          <p className="text-base text-[#64748b] max-w-xl mx-auto">
            Система управления инженерной документацией для проектных и строительных компаний
          </p>
        </div>

        {/* 4 карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <FeatureCard
            icon={<FileText size={28} className="text-[#3b82f6]" />}
            title="Единый поток"
            description="Все документы в одном месте"
          />
          <FeatureCard
            icon={<GitBranch size={28} className="text-[#3b82f6]" />}
            title="Согласования"
            description="Прозрачные маршруты"
          />
          <FeatureCard
            icon={<Shield size={28} className="text-[#3b82f6]" />}
            title="Контроль версий"
            description="Ничего не теряется"
          />
          <FeatureCard
            icon={<Zap size={28} className="text-[#3b82f6]" />}
            title="Скорость"
            description="От чертежа до подписи"
          />
        </div>

        {/* Кнопка */}
        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
          >
            <span className="underline">Войти в систему</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#e2e8f0] hover:shadow-md transition-shadow text-center">
      <div className="w-14 h-14 bg-[#f1f5f9] rounded-xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-[#1e2230] mb-1">{title}</h3>
      <p className="text-sm text-[#64748b]">{description}</p>
    </div>
  );
}
