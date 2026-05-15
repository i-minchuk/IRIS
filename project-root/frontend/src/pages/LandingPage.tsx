import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { ArrowRight, FileText, FolderKanban, Gavel, Archive, ShieldCheck, Zap } from 'lucide-react';
import { Crystal } from '@/components/Crystal';
import { useZoomStore } from '@/features/zoom/store/zoomStore';

const FeatureCard = ({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div 
      className="p-5 rounded-xl text-center transition-all duration-200 relative z-[2]"
      style={{
        border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`,
        background: isDark ? 'rgba(13,17,23,0.72)' : 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = isDark 
          ? '0 4px 16px rgba(0,0,0,0.3)' 
          : '0 4px 16px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div 
        className="w-11 h-11 rounded-[10px] flex items-center justify-center mx-auto mb-2.5"
        style={{
          background: isDark ? 'rgba(92,117,224,0.1)' : 'rgba(59,79,168,0.08)',
          color: isDark ? '#5C75E0' : '#3B4FA8',
        }}
      >
        {icon}
      </div>
      <div className="text-[13px] font-semibold mb-1" style={{ color: isDark ? '#E2E5EC' : '#1E2230' }}>{title}</div>
      <div className="text-[11px] leading-relaxed" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>
        {lines.map((line, i) => (<span key={i}>{line}{i < lines.length - 1 && <br />}</span>))}
      </div>
    </div>
  );
};

const FloatingCrystal = ({ color, darkColor, size, top, left, right, rotate, delay, duration, opacity = 0.6 }: any) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const crystalColor = isDark ? darkColor : color;

  // Параметры hover — меняй здесь
  const hoverRotate = isHovered ? 75 : 0;   // ← УГОЛ ПОВОРОТА
  const hoverScale  = isHovered ? 1.15 : 1; // ← МАСШТАБ
  const hoverOpacity = isHovered ? Math.min(opacity * 1.6, 0.95) : opacity; // ← ЯРКОСТЬ

  // Свечение при наведении
  const glowRadius = isHovered ? 28 : (isDark ? 12 : 8);
  const glowAlpha  = isHovered ? 'FF' : (isDark ? 'C0' : 'A0');

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        top,
        left,
        right,
        transform: `rotate(${rotate + hoverRotate}deg) scale(${hoverScale})`,
        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        animationName: mounted ? 'floatCrystal' : 'none',
        animationDuration: mounted ? `${duration}s` : '0s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}ms`,
        zIndex: 1,
        cursor: 'pointer',
        opacity: hoverOpacity,
        willChange: 'transform',
      }}
    >
      <Crystal
        color={crystalColor}
        size={size}
        style={{
          filter: `drop-shadow(0 0 ${glowRadius}px ${crystalColor}${glowAlpha})`,
          transition: 'filter 0.3s ease',
        }}
      />
    </div>
  );
};

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // ← ВСТАВЬ ЭТО:
  const { setHidden } = useZoomStore();
  useEffect(() => {
    setHidden(true);              // скрыть зум на лендинге
    return () => setHidden(false); // показать при уходе
  }, [setHidden]);
  // ==========


  const crystals = [
    { id: 'c1', color: '#8D79C7', darkColor: '#A898D9', size: 48, top: '8%', left: '4%', rotate: -22, delay: 0, duration: 5.8, opacity: 0.75 },
    { id: 'c2', color: '#3B4FA8', darkColor: '#5C75E0', size: 36, top: '3%', left: '18%', rotate: 15, delay: 300, duration: 6.5, opacity: 0.75 },
    { id: 'c3', color: '#D4A62A', darkColor: '#E8C44A', size: 28, top: '14%', left: '30%', rotate: 42, delay: 150, duration: 5.2, opacity: 0.75 },
    { id: 'c4', color: '#8D79C7', darkColor: '#A898D9', size: 52, top: '2%', left: '55%', rotate: -10, delay: 600, duration: 7.0, opacity: 0.75 },
    { id: 'c5', color: '#3B4FA8', darkColor: '#5C75E0', size: 32, top: '10%', left: '72%', rotate: 25, delay: 450, duration: 6.2, opacity: 0.75 },
    { id: 'c6', color: '#D4A62A', darkColor: '#E8C44A', size: 44, top: '6%', right: '6%', rotate: 35, delay: 200, duration: 6.8, opacity: 0.75 },
    { id: 'c7', color: '#222B5C', darkColor: '#5C75E0', size: 38, top: '16%', right: '18%', rotate: -18, delay: 800, duration: 5.5, opacity: 0.75 },
    { id: 'c8', color: '#3B4FA8', darkColor: '#5C75E0', size: 64, top: '30%', left: '8%', rotate: 8, delay: 100, duration: 6.2, opacity: 0.75 },
    { id: 'c9', color: '#8D79C7', darkColor: '#A898D9', size: 44, top: '34%', left: '26%', rotate: -30, delay: 500, duration: 5.0, opacity: 0.75 },
    { id: 'c10', color: '#D4A62A', darkColor: '#E8C44A', size: 56, top: '28%', left: '45%', rotate: 12, delay: 250, duration: 6.5, opacity: 0.75 },
    { id: 'c11', color: '#8D79C7', darkColor: '#A898D9', size: 34, top: '36%', left: '62%', rotate: -8, delay: 700, duration: 5.3, opacity: 0.75 },
    { id: 'c12', color: '#3B4FA8', darkColor: '#5C75E0', size: 48, top: '32%', right: '12%', rotate: 20, delay: 350, duration: 6.0, opacity: 0.75 },
    { id: 'c13', color: '#D4A62A', darkColor: '#E8C44A', size: 30, top: '40%', right: '28%', rotate: -22, delay: 900, duration: 5.7, opacity: 0.75 },
    { id: 'c14', color: '#222B5C', darkColor: '#5C75E0', size: 42, top: '38%', right: '45%', rotate: 33, delay: 150, duration: 6.4, opacity: 0.75 },
    { id: 'c15', color: '#8D79C7', darkColor: '#A898D9', size: 50, top: '52%', left: '5%', rotate: -14, delay: 400, duration: 5.9, opacity: 0.75 },
    { id: 'c16', color: '#3B4FA8', darkColor: '#5C75E0', size: 36, top: '58%', left: '20%', rotate: 18, delay: 600, duration: 6.3, opacity: 0.75 },
    { id: 'c17', color: '#D4A62A', darkColor: '#E8C44A', size: 40, top: '54%', left: '38%', rotate: -5, delay: 200, duration: 5.4, opacity: 0.75 },
    { id: 'c18', color: '#8D79C7', darkColor: '#A898D9', size: 28, top: '60%', left: '52%', rotate: 28, delay: 750, duration: 6.6, opacity: 0.75 },
    { id: 'c19', color: '#3B4FA8', darkColor: '#5C75E0', size: 46, top: '56%', right: '22%', rotate: -25, delay: 300, duration: 5.1, opacity: 0.75 },
    { id: 'c20', color: '#D4A62A', darkColor: '#E8C44A', size: 32, top: '62%', right: '8%', rotate: 14, delay: 500, duration: 6.0, opacity: 0.75 },
    { id: 'c21', color: '#8D79C7', darkColor: '#A898D9', size: 44, top: '74%', left: '12%', rotate: -20, delay: 100, duration: 5.6, opacity: 0.75 },
    { id: 'c22', color: '#3B4FA8', darkColor: '#5C75E0', size: 38, top: '78%', left: '35%', rotate: 10, delay: 450, duration: 6.2, opacity: 0.75 },
    { id: 'c23', color: '#D4A62A', darkColor: '#E8C44A', size: 52, top: '72%', left: '58%', rotate: -12, delay: 250, duration: 5.8, opacity: 0.75 },
    { id: 'c24', color: '#222B5C', darkColor: '#5C75E0', size: 34, top: '80%', left: '75%', rotate: 22, delay: 800, duration: 6.5, opacity: 0.75 },
    { id: 'c25', color: '#8D79C7', darkColor: '#A898D9', size: 48, top: '76%', right: '14%', rotate: -8, delay: 350, duration: 5.3, opacity: 0.75 },
    { id: 'c26', color: '#3B4FA8', darkColor: '#5C75E0', size: 30, top: '86%', right: '32%', rotate: 16, delay: 600, duration: 6.1, opacity: 0.75 },
    { id: 'c27', color: '#D4A62A', darkColor: '#E8C44A', size: 42, top: '88%', right: '8%', rotate: -28, delay: 150, duration: 5.5, opacity: 0.75 },
    { id: 'c28', color: '#8D79C7', darkColor: '#A898D9', size: 26, top: '92%', left: '48%', rotate: 5, delay: 900, duration: 6.8, opacity: 0.75 },
  ];

  const features = [
    { icon: <FileText size={20} />, title: 'Документооборот', lines: ['Единое пространство', 'для ИТД и ИИД'] },
    { icon: <FolderKanban size={20} />, title: 'Управление проектами', lines: ['Контроль сроков,', 'ресурсов и рисков'] },
    { icon: <Gavel size={20} />, title: 'Тендерный отдел', lines: ['Подготовка КД', 'и спецификаций'] },
    { icon: <Archive size={20} />, title: 'Архив и шаблоны', lines: ['Типовые решения', 'и ревизии'] },
    { icon: <ShieldCheck size={20} />, title: 'Замечания и согласования', lines: ['Workflow', 'внутри компании'] },
    { icon: <Zap size={20} />, title: 'AI-ассистент', lines: ['Проверка документов', 'и рекомендации'] },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: isDark ? '#0D1117' : '#F5F6FA' }}>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-[100]">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150"
          style={{
            background: isDark ? '#151B38' : '#FFFFFF',
            border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`,
            color: isDark ? '#8B92A8' : '#6B7280',
          }}
          title={isDark ? 'Светлая тема' : 'Тёмная тема'}
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Background glow */}
      <div 
        className="fixed pointer-events-none"
        style={{
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: isDark 
            ? 'radial-gradient(ellipse at center, rgba(92,117,224,0.1) 0%, transparent 60%)'
            : 'radial-gradient(ellipse at center, rgba(59,79,168,0.08) 0%, transparent 60%)',
          zIndex: 0,
        }}
      />

      {/* Floating Crystals */}
      {crystals.map((c) => (
        <FloatingCrystal
          key={c.id}
          color={c.color}
          darkColor={c.darkColor}
          size={c.size}
          top={c.top}
          left={c.left}
          right={c.right}
          rotate={c.rotate}
          delay={c.delay}
          duration={c.duration}
          opacity={c.opacity}
        />
      ))}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-[2]">

        {/* Brand Block */}
        <div className="flex items-center justify-center gap-4 mb-2 relative z-[2]">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: isDark ? '#151B38' : '#FFFFFF',
              boxShadow: isDark 
                ? '0 4px 30px rgba(92,117,224,0.3), 0 0 60px rgba(141,121,199,0.15)' 
                : '0 4px 20px rgba(59,79,168,0.2)',
              animation: isDark ? 'iconGlow 3s ease-in-out infinite' : 'none',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 36 36">
              <rect x="3" y="3" width="30" height="30" rx="6" fill={isDark ? '#5C75E0' : '#3B4FA8'} />
              <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
              <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
              <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
              <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
            </svg>
          </div>
          <div>
            <div 
              className="text-[42px] font-bold tracking-tight"
              style={{ 
                fontFamily: "'Montserrat', sans-serif",
                color: isDark ? '#E2E5EC' : '#1E2230',
                letterSpacing: '-0.5px',
              }}
            >
              ДокПоток{' '}
              <span 
                className="text-[28px] font-bold px-3 py-1 rounded-lg align-middle"
                style={{ 
                  background: isDark ? '#5C75E0' : '#3B4FA8', 
                  color: '#fff',
                  marginLeft: '6px',
                }}
              >
                IRIS
              </span>
            </div>
            <div 
              className="w-[180px] h-1 rounded-full mt-2"
              style={{ 
                background: isDark ? '#E8C44A' : '#D4A62A',
                boxShadow: isDark ? '0 0 12px rgba(232,196,74,0.5)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Subtitle */}
        <div 
          className="text-center mt-4 mb-10 max-w-md relative z-[2]"
          style={{ color: isDark ? '#8B92A8' : '#6B7280' }}
        >
          <p className="text-[15px] leading-relaxed">
            Интеллектуальная система управления инженерной документацией, 
            проектами и тендерными процессами
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-[640px] mb-10 relative z-[2]">
          {features.map((f, idx) => (
            <FeatureCard key={idx} icon={f.icon} title={f.title} lines={f.lines} />
          ))}
        </div>

        {/* CTA Button */}
        <Link 
          to="/login"
          className="group relative z-[2] inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-[14px] font-semibold transition-all duration-200"
          style={{
            background: isDark ? '#5C75E0' : '#3B4FA8',
            color: '#fff',
            boxShadow: isDark 
              ? '0 4px 24px rgba(92,117,224,0.4)' 
              : '0 4px 16px rgba(59,79,168,0.25)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = isDark 
              ? '0 8px 32px rgba(92,117,224,0.5)' 
              : '0 8px 24px rgba(59,79,168,0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDark 
              ? '0 4px 24px rgba(92,117,224,0.4)' 
              : '0 4px 16px rgba(59,79,168,0.25)';
          }}
        >
          Войти в систему
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* Footer hint */}
        <div 
          className="mt-8 text-[11px] relative z-[2]"
          style={{ color: isDark ? 'rgba(139,146,168,0.5)' : 'rgba(107,114,128,0.6)' }}
        >
          © {new Date().getFullYear()} ДокПоток IRIS — инженерный документооборот
        </div>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes floatCrystal {
          0%, 100% { transform: translateY(0px) rotate(var(--rotate, 0deg)); }
          50% { transform: translateY(-20px) rotate(calc(var(--rotate, 0deg) + 3deg)); }
        }
        @keyframes iconGlow {
          0%, 100% { box-shadow: 0 4px 30px rgba(92,117,224,0.3), 0 0 60px rgba(141,121,199,0.15); }
          50% { box-shadow: 0 4px 40px rgba(92,117,224,0.45), 0 0 80px rgba(141,121,199,0.25); }
        }
      `}</style>
    </div>
  );
}