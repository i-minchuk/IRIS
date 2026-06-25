import { Link } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { ArrowRight, FileText, FolderKanban, Gavel, Archive, ShieldCheck, Zap } from 'lucide-react';
import { ChromeBot } from '@/components/ChromeBot';

const FeatureCard = ({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  return (
    <div
      className="p-2.5 md:p-3 rounded-xl text-center transition-all duration-200 relative z-[2]"
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
        className="w-8 h-8 md:w-9 md:h-9 rounded-[8px] flex items-center justify-center mx-auto mb-1 md:mb-1.5"
        style={{
          background: isDark ? 'rgba(92,117,224,0.1)' : 'rgba(59,79,168,0.08)',
          color: isDark ? '#5C75E0' : '#3B4FA8',
        }}
      >
        {icon}
      </div>
      <div className="text-[11px] md:text-xs font-semibold mb-0.5" style={{ color: isDark ? '#E2E5EC' : '#1E2230' }}>{title}</div>
      <div className="text-[10px] md:text-xs leading-snug" style={{ color: isDark ? '#8B92A8' : '#6B7280' }}>
        {lines.map((line, i) => (<span key={i}>{line}{i < lines.length - 1 && <br />}</span>))}
      </div>
    </div>
  );
};

export default function LandingPage() {
  const { theme, cycleTheme, themeLabel } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';

  const features = [
    { icon: <FileText size={18} />, title: 'Документооборот', lines: ['Единое пространство', 'для ИТД и ИИД'] },
    { icon: <FolderKanban size={18} />, title: 'Управление проектами', lines: ['Контроль сроков,', 'ресурсов и рисков'] },
    { icon: <Gavel size={18} />, title: 'Тендерный отдел', lines: ['Подготовка КД', 'и спецификаций'] },
    { icon: <Archive size={18} />, title: 'Архив и шаблоны', lines: ['Типовые решения', 'и ревизии'] },
    { icon: <ShieldCheck size={18} />, title: 'Замечания и согласования', lines: ['Workflow', 'внутри компании'] },
    { icon: <Zap size={18} />, title: 'AI-ассистент', lines: ['Проверка документов', 'и рекомендации'] },
  ];

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden" style={{ background: isDark ? '#0D1117' : '#F5F6FA' }}>

      {/* Theme toggle */}
      <div className="fixed top-3 right-3 z-[100]">
        <button
          onClick={cycleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150"
          style={{
            background: isDark ? '#151B38' : '#FFFFFF',
            border: `1px solid ${isDark ? '#3D4554' : '#CED2DD'}`,
            color: isDark ? '#8B92A8' : '#6B7280',
          }}
          title={`Тема: ${themeLabel}`}
        >
          {isDark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Main Content */}
      <div className="landing-content flex-1 flex flex-col items-center justify-between px-4 py-3 md:py-4 w-full overflow-hidden">

        {/* Brand Block */}
        <div className="flex items-center justify-center gap-3 md:gap-4 relative z-[2] shrink-0">
          <div
            className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center"
            style={{
              background: isDark ? '#151B38' : '#FFFFFF',
              boxShadow: isDark
                ? '0 4px 30px rgba(92,117,224,0.3), 0 0 60px rgba(141,121,199,0.15)'
                : '0 4px 20px rgba(59,79,168,0.2)',
              animation: isDark ? 'iconGlow 3s ease-in-out infinite' : 'none',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 36 36" className="md:w-[32px] md:h-[32px]">
              <rect x="3" y="3" width="30" height="30" rx="6" fill={isDark ? '#5C75E0' : '#3B4FA8'} />
              <rect x="9" y="10" width="18" height="2.5" rx="1.25" fill="white" opacity="0.85" />
              <rect x="9" y="15" width="14" height="2.5" rx="1.25" fill="white" opacity="0.6" />
              <rect x="9" y="20" width="10" height="2.5" rx="1.25" fill="white" opacity="0.4" />
              <rect x="9" y="26" width="20" height="3" rx="1.5" fill={isDark ? '#E8C44A' : '#D4A62A'} />
            </svg>
          </div>
          <div>
            <div
              className="text-[clamp(1.5rem,4vw,2.25rem)] font-bold tracking-tight"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                color: isDark ? '#E2E5EC' : '#1E2230',
                letterSpacing: '-0.5px',
              }}
            >
              ДокПоток{' '}
              <span
                className="text-[clamp(1rem,2.5vw,1.25rem)] font-bold px-1.5 md:px-2 py-0.5 rounded-md align-middle"
                style={{
                  background: isDark ? '#5C75E0' : '#3B4FA8',
                  color: '#fff',
                  marginLeft: '4px',
                }}
              >
                IRIS
              </span>
            </div>
            <div
              className="w-[100px] md:w-[140px] h-0.5 rounded-full mt-1.5"
              style={{
                background: isDark ? '#E8C44A' : '#D4A62A',
                boxShadow: isDark ? '0 0 12px rgba(232,196,74,0.5)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Subtitle */}
        <div
          className="text-center max-w-md md:max-w-lg relative z-[2] shrink-0"
          style={{ color: isDark ? '#8B92A8' : '#6B7280' }}
        >
          <p className="text-xs md:text-sm leading-snug">
            Интеллектуальная система управления технической документацией,
            проектами и тендерными процессами
          </p>
        </div>

        {/* ChromeBot */}
        <div className="flex items-center justify-center shrink-0">
          <ChromeBot size={180} variant={isDark ? 'dark' : 'light'} className="md:w-[220px] md:h-[220px]" />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 w-full max-w-[520px] lg:max-w-[640px] xl:max-w-[800px] relative z-[2] shrink-0">
          {features.map((f, idx) => (
            <FeatureCard key={idx} icon={f.icon} title={f.title} lines={f.lines} />
          ))}
        </div>

        {/* CTA Button */}
        <Link
          to="/login"
          className="group relative z-[2] inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 shrink-0"
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
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </Link>

        {/* Footer hint */}
        <div
          className="text-[11px] relative z-[2] shrink-0"
          style={{ color: isDark ? 'rgba(139,146,168,0.5)' : 'rgba(107,114,128,0.6)' }}
        >
          © {new Date().getFullYear()} ДокПоток IRIS — технический документооборот
        </div>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes iconGlow {
          0%, 100% { box-shadow: 0 4px 30px rgba(92,117,224,0.3), 0 0 60px rgba(141,121,199,0.15); }
          50% { box-shadow: 0 4px 40px rgba(92,117,224,0.45), 0 0 80px rgba(141,121,199,0.25); }
        }
      `}</style>
    </div>
  );
}
