import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

interface LayoutProps {
  children?: React.ReactNode;
}

const navItems = [
  { to: '/dashboard', label: 'Руководители' },
  { to: '/projects', label: 'Инженерные группы' },
  { to: '/production', label: 'Производство' },
  { to: '/documents', label: 'Документооборот' },
  { to: '/approvals', label: 'Согласования' },
  { to: '/audit', label: 'Аудит и контроль' },
];

export default function Layout({ children }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        event.target instanceof Node &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    navigate('/login');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--layout-bg)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
      {/* ===== ШАПКА ===== */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
        <div className="mx-auto w-full max-w-6xl flex min-h-14 items-center justify-between gap-4 px-4 md:px-6">
          {/* Логотип + Навигация */}
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3 no-underline">
              <img src="/Иконка ДокПоток IRIS.png" alt="ДокПоток IRIS" className="h-9 w-9 rounded-lg object-contain" />
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', letterSpacing: '2px' }}>
                  ДокПоток
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ fontFamily: 'var(--font-heading)', backgroundColor: 'var(--iris-accent-blue)', color: 'var(--iris-text-inverse)', letterSpacing: '1px' }}>
                  IRIS
                </span>
              </div>
            </Link>

            {/* Навигация */}
            <nav className="hidden items-end gap-1 overflow-x-auto pt-2 lg:flex" aria-label="Главная навигация">
              {navItems.map((item) => {
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 whitespace-nowrap"
                    style={{
                      color: active ? 'var(--iris-text-inverse)' : 'var(--text-secondary)',
                      backgroundColor: active ? 'var(--iris-accent-blue)' : 'transparent',
                      fontFamily: 'var(--font-body)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: 'var(--iris-accent-cyan)' }} />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Правая панель: тема, уведомления, пользователь */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Переключатель темы */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Переключить тему"
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Уведомления */}
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Уведомления"
              title="Уведомления"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none" style={{ backgroundColor: 'var(--iris-accent-coral)', color: 'var(--iris-text-inverse)' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {/* Меню пользователя */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150"
                style={{ color: 'var(--text-primary)' }}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (!showUserMenu) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--iris-accent-blue)' }}>
                  <User size={16} color="white" />
                </div>
                <span className="hidden md:inline">Администратор</span>
                <ChevronDown size={16} />
              </button>

              {/* Выпадающее меню */}
              {showUserMenu ? (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border shadow-lg" style={{ backgroundColor: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--iris-shadow-lg)' }} role="menu">
                  <div className="border-b px-4 py-3" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                    <div className="font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Администратор</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>admin@iris-demo.com</div>
                  </div>
                  <div className="p-2">
                    <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150" style={{ color: 'var(--text-primary)' }} role="menuitem"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <User size={16} style={{ color: 'var(--iris-accent-blue)' }} />
                      Профиль
                    </button>
                    <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150" style={{ color: 'var(--iris-accent-coral)' }} role="menuitem" onClick={handleLogout}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-status-bg-coral)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <LogOut size={16} />
                      Выйти
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* ===== ОСНОВНОЙ КОНТЕНТ ===== */}
      <main className="px-4 py-6 md:px-6" style={{ backgroundColor: 'var(--layout-bg)', color: 'var(--text-primary)', minHeight: 'calc(100vh - var(--iris-header-height))' }}>
        <div className="mx-auto w-full max-w-6xl">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}
