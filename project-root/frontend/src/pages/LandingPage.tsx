import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { ArrowRight } from 'lucide-react';
import { Crystal } from '@/components/Crystal';

const FeatureCard = ({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div 
      className="p-5 rounded-xl text-center transition-all duration-200"
      style={{
        border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`,
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.5)',
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
      <div className="text-[13px] font-semibold mb-1" style={{ color: isDark ? '#E2E5EC' : '#1E2230' }}>
        {title}
      </div>
      <div className="text-[11px] leading-relaxed" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>
        {lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
};

const FloatingCrystal = ({ color, darkColor, size, top, left, right, rotate, delay, duration }: any) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const crystalColor = isDark ? darkColor : color;

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        right,
        transform: `rotate(${rotate}deg)`,
        animationName: mounted ? 'floatCrystal' : 'none',
        animationDuration: mounted ? `${duration}s` : '0s',
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDelay: `${delay}ms`,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <Crystal
        color={crystalColor}
        size={size}
        style={{
          filter: isDark 
            ? `drop-shadow(0 0 12px ${crystalColor}80)` 
            : `drop-shadow(0 0 8px ${crystalColor}60)`,
        }}
      />
    </div>
  );
};

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const crystals = [
    { id: 'c1', color: '#8D79C7', darkColor: '#A898D9', size: 55, top: '8%', left: '8%', rotate: -15, delay: 0, duration: 5.5 },
    { id: 'c2', color: '#3B4FA8', darkColor: '#5C75E0', size: 50, top: '6%', left: '45%', rotate: 10, delay: 200, duration: 6.2 },
    { id: 'c3', color: '#D4A62A', darkColor: '#E8C44A', size: 52, top: '10%', right: '8%', rotate: 20, delay: 400, duration: 5.8 },
    { id: 'c4', color: '#3B4FA8', darkColor: '#5C75E0', size: 48, top: '55%', left: '6%', rotate: -8, delay: 600, duration: 6.5 },
    { id: 'c5', color: '#8D79C7', darkColor: '#A898D9', size: 50, top: '60%', left: '48%', rotate: 12, delay: 800, duration: 5.2 },
    { id: 'c6', color: '#222B5C', darkColor: '#5C75E0', size: 52, top: '58%', right: '6%', rotate: 18, delay: 1000, duration: 6.0 },
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
          zIndex: -1,
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
        />
      ))}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative z-[2]">
        
        {/* Brand */}
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
                boxShadow: isDark ? '0 0 10px rgba(232,196,74,0.4)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-center text-4xl font-bold mt-6 mb-2 relative z-[2]"
          style={{ 
            fontFamily: "'Montserrat', sans-serif",
            color: isDark ? '#E2E5EC' : '#1E2230',
          }}
        >
          От чертежа до согласования
          <br />
          <span style={{ color: isDark ? '#5C75E0' : '#3B4FA8' }}>
            за один поток
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className="text-center text-[15px] mb-10 max-w-[480px] relative z-[2]"
          style={{ color: isDark ? '#8B92A8' : '#6B7280' }}
        >
          Система управления инженерной документацией для проектных и строительных компаний
        </p>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 max-w-[720px] w-full relative z-[2]">
          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
            title="Единый поток"
            lines={['Все документы', 'в одном месте']}
          />
          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="15" />
                <circle cx="18" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
            }
            title="Согласования"
            lines={['Прозрачные', 'маршруты']}
          />
          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Контроль версий"
            lines={['Ничего', 'не теряется']}
          />
          <FeatureCard
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
            title="Скорость"
            lines={['От чертежа', 'до подписи']}
          />
        </div>

        {/* CTA */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-[15px] text-white transition-all duration-200 relative z-[100]"
          style={{
            background: isDark ? '#5C75E0' : '#3B4FA8',
            boxShadow: isDark 
              ? '0 0 20px rgba(92,117,224,0.3), 0 4px 12px rgba(0,0,0,0.3)' 
              : '0 0 20px rgba(59,79,168,0.25), 0 4px 12px rgba(0,0,0,0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? '#6B85F0' : '#4A5EC0';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = isDark ? '#5C75E0' : '#3B4FA8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          Войти в систему
          <ArrowRight size={18} />
        </Link>
      </div>

      {/* Footer */}
      <div 
        className="text-center py-4 text-xs relative z-[2]"
        style={{ color: isDark ? '#8B92A8' : '#6B7280' }}
      >
        ДокПоток IRIS © 2026
      </div>
    </div>
  );
}