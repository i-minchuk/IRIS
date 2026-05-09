import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, GitBranch, Shield, Zap } from 'lucide-react';
import { Crystal } from '@/components/Crystal';

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-[#1E2230] relative overflow-hidden">
      {/* 5 кристаллов в цветах основных вкладок */}
      <div className="absolute top-[8%] left-[8%]">
        <Crystal color="#3B82F6" size={56} style={{ transform: 'rotate(-15deg)', opacity: 0.45 }} />
      </div>
      <div className="absolute top-[12%] right-[12%]">
        <Crystal color="#6B5B95" size={48} style={{ transform: 'rotate(25deg)', opacity: 0.5 }} />
      </div>
      <div className="absolute top-[55%] left-[5%]">
        <Crystal color="#4F7A4C" size={44} style={{ transform: 'rotate(-30deg)', opacity: 0.4 }} />
      </div>
      <div className="absolute top-[70%] right-[8%]">
        <Crystal color="#D4AF37" size={52} style={{ transform: 'rotate(20deg)', opacity: 0.45 }} />
      </div>
      <div className="absolute top-[85%] left-[35%]">
        <Crystal color="#6B7280" size={40} style={{ transform: 'rotate(-10deg)', opacity: 0.35 }} />
      </div>

      {/* Центральный контент */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
        
        {/* Логотип */}
        <div className="flex items-center gap-3 mb-8">
          <img
            src="/Иконка ДокПоток IRIS.png"
            alt="ДокПоток IRIS"
            className="w-12 h-12 rounded-xl"
          />
          <span className="text-2xl font-bold text-[#E8ECF1]">ДокПоток</span>
          <span className="px-3 py-1 bg-[#3b82f6] text-white text-sm font-bold rounded-lg">IRIS</span>
        </div>

        {/* Заголовок */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#E8ECF1] text-center mb-2">
          От чертежа до согласования
        </h1>
        <h2 className="text-3xl md:text-4xl font-bold text-neon-blue text-center mb-6">
          за один поток
        </h2>
        <p className="text-[#94A3B8] text-center max-w-lg mb-12">
          Система управления инженерной документацией для проектных и строительных компаний
        </p>

        {/* 4 карточки фич */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mb-12">
          <FeatureCard 
            icon={<FileText size={24} className="text-[#3b82f6]" />}
            title="Единый поток"
            description="Все документы в одном месте"
            neon="neon-blue"
          />
          <FeatureCard 
            icon={<GitBranch size={24} className="text-[#6B5B95]" />}
            title="Согласования"
            description="Прозрачные маршруты"
            neon="neon-purple"
          />
          <FeatureCard 
            icon={<Shield size={24} className="text-[#4f7a4c]" />}
            title="Контроль версий"
            description="Ничего не теряется"
            neon="neon-green"
          />
          <FeatureCard 
            icon={<Zap size={24} className="text-[#D4AF37]" />}
            title="Скорость"
            description="От чертежа до подписи"
            neon="neon-yellow"
          />
        </div>

        {/* Кнопка входа */}
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-transparent border border-[#3b82f6] text-[#3b82f6] rounded-xl font-medium transition-all duration-300 flex items-center gap-2 group hover:bg-[#3b82f6]/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          Войти в систему
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, neon }: { icon: React.ReactNode; title: string; description: string; neon: string }) {
  return (
    <div className={`bg-[#2A3042] ${neon} rounded-2xl p-6 text-center transition-all hover:scale-105`}>
      <div className="w-12 h-12 bg-[#1E2230]/50 rounded-xl flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-[#E8ECF1] mb-1">{title}</h3>
      <p className="text-sm text-[#94A3B8]">{description}</p>
    </div>
  );
}
