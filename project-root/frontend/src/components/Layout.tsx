import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Bell, User, LogOut, ChevronDown, BarChart3, FolderKanban, FileText, ArrowLeftRight, Archive } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

/* ── Nav items with page colors ── */
const navItems = [
  { to: '/dashboard', label: 'Панель аналитики', icon: <BarChart3 size={16} />, color: '#4F7A4C', bgActive: 'rgba(79, 122, 76, 0.15)' },
  { to: '/projects', label: 'Портфель заказов', icon: <FolderKanban size={16} />, color: '#6B5B95', bgActive: 'rgba(107, 91, 149, 0.15)' },
  { to: '/documents', label: 'Документация', icon: <FileText size={16} />, color: '#D4AF37', bgActive: 'rgba(212, 175, 55, 0.15)' },
  { to: '/workflow', label: 'Документооборот', icon: <ArrowLeftRight size={16} />, color: '#FF6B6B', bgActive: 'rgba(255, 107, 107, 0.15)' },
  { to: '/archive', label: 'Архив', icon: <Archive size={16} />, color: '#6B7280', bgActive: 'rgba(107, 114, 128, 0.15)' },
];

export default function Layout() {
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
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      {/* ===== TOP BAR (logo + actions) ===== */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="mx-auto w-full max-w-7xl flex min-h-14 items-center justify-between gap-4 px-4 md:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 no-underline shrink-0">
            <img
              src="/Иконка ДокПоток IRIS.png"
              alt="ДокПоток IRIS"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '2px' }}>
                ДокПоток
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{ background: '#3B82F6', color: '#FFFFFF', letterSpacing: '1px' }}
              >
                IRIS
              </span>
            </div>
          </Link>

          {/* Right panel: theme, notifications, user */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: 'var(--text-secondary)' }}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
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

            {/* Notifications */}
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Уведомления"
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
                <span
                  className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
                  style={{ background: '#F87171', color: '#FFFFFF' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : null}
            </button>

            {/* User menu */}
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
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: '#3B82F6' }}
                >
                  <User size={16} color="white" />
                </div>
                <span className="hidden md:inline">Администратор</span>
                <ChevronDown size={16} />
              </button>

              {showUserMenu ? (
                <div
                  className="absolute right-0 mt-2 w-64 rounded-xl border shadow-lg"
                  style={{
                    background: 'var(--iris-bg-surface)',
                    borderColor: 'var(--iris-border-subtle)',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--iris-shadow-lg)',
                  }}
                  role="menu"
                >
                  <div className="border-b px-4 py-3" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                    <div className="font-semibold">Администратор</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      admin@iris-demo.com
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150"
                      style={{ color: 'var(--text-primary)' }}
                      role="menuitem"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <User size={16} style={{ color: '#3B82F6' }} />
                      Профиль
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150"
                      style={{ color: '#F87171' }}
                      role="menuitem"
                      onClick={handleLogout}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
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

      {/* ===== NAVIGATION TABS (separate row below header) ===== */}
      <div
        className="border-b"
        style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-2" aria-label="Главная навигация">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative px-2 py-2 sm:px-4 sm:py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap"
                  style={{
                    color: active ? item.color : 'var(--text-secondary)',
                    backgroundColor: active ? item.bgActive : 'transparent',
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
                <span className="flex items-center gap-2">
                  <span style={{ color: active ? item.color : 'var(--text-secondary)' }}>{item.icon}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </span>
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full"
                      style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ===== MAIN CONTENT (full width, no sidebar) ===== */}
      <main className="flex-1 px-4 py-6 md:px-6" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}