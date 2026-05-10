import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Bell, User, LogOut, ChevronDown,
  BarChart3, FolderKanban, FileText, ArrowLeftRight, Archive,
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguageContext } from "@/features/profile/i18n/LanguageContext";
import { t } from "@/features/profile/i18n/translations";

/* ── Nav items ── */
const navItems = [
  { to: '/dashboard', label: 'Панель аналитики', icon: <BarChart3 size={16} />, color: '#4F7A4C', bgActive: 'rgba(79, 122, 76, 0.15)' },
  { to: '/projects', label: 'Портфель заказов', icon: <FolderKanban size={16} />, color: '#6B5B95', bgActive: 'rgba(107, 91, 149, 0.15)' },
  { to: '/documents', label: 'Документация', icon: <FileText size={16} />, color: '#D4AF37', bgActive: 'rgba(212, 175, 55, 0.15)' },
  { to: '/workflow', label: 'Документооборот', icon: <ArrowLeftRight size={16} />, color: '#FF6B6B', bgActive: 'rgba(255, 107, 107, 0.15)' },
  { to: '/archive', label: 'Архив', icon: <Archive size={16} />, color: '#6B7280', bgActive: 'rgba(107, 114, 128, 0.15)' },
];

/* ── Notifications ── */
interface Notification {
  id: string;
  type: 'remark' | 'approval' | 'deadline' | 'tender' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

const notificationsData: Notification[] = [
  { id: 'n1', type: 'remark',    title: 'Новое замечание',      description: 'КЖ-01-001: несоответствие арматуры в узле',     time: '5 мин назад',  read: false, link: '/workflow' },
  { id: 'n2', type: 'approval',  title: 'Документ согласован',  description: 'АР-03-015 утверждён ГИП',                        time: '30 мин назад', read: false, link: '/documents' },
  { id: 'n3', type: 'deadline',  title: 'Дедлайн приближается', description: 'Тендер ТЭЦ-5 — раскрытие через 2 дня',          time: '2 ч назад',    read: false, link: '/projects' },
  { id: 'n4', type: 'tender',    title: 'Тендер выигран!',      description: 'ЖК «Северный» — победа в конкурсе',              time: 'Вчера',        read: true,  link: '/projects' },
  { id: 'n5', type: 'system',    title: 'Обновление системы',   description: 'DokPotok IRIS v1.1 — новые фильтры в архиве',  time: '2 дня назад',  read: true },
  { id: 'n6', type: 'remark',    title: 'Замечание закрыто',    description: 'ОВиК-02-008: исправления проверены',            time: '3 дня назад',  read: true,  link: '/workflow' },
];

const notifConfig: Record<Notification['type'], { color: string }> = {
  remark:   { color: '#FF6B6B' },
  approval: { color: '#4F7A4C' },
  deadline: { color: '#D4AF37' },
  tender:   { color: '#6B5B95' },
  system:   { color: '#3B82F6' },
};

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(notificationsData);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark';
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const markAllRead = (id: string) => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    navigate('/login');
  };

  const { lang } = useLanguageContext();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      {/* ===== TOP BAR ===== */}
      <header className="sticky top-0 z-50 border-b" style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
        <div className="mx-auto w-full max-w-7xl flex min-h-14 items-center justify-between gap-4 px-4 md:px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 no-underline shrink-0">
            <img src="/Иконка ДокПоток IRIS.png" alt="ДокПоток IRIS" className="h-9 w-9 rounded-lg object-contain" />
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', letterSpacing: '2px' }}>ДокПоток</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: '#3B82F6', color: '#FFFFFF', letterSpacing: '1px' }}>IRIS</span>
            </div>
          </Link>

          {/* Right panel */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
              style={{ color: 'var(--text-secondary)' }}
              aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
              title={isDark ? 'Светлая тема' : 'Тёмная тема'}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(prev => !prev)}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Уведомления"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none" style={{ background: '#FF6B6B', color: '#FFFFFF' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border shadow-lg overflow-hidden"
                  style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', boxShadow: 'var(--iris-shadow-lg)', zIndex: 50 }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Уведомления</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: 'var(--iris-accent-blue)' }}>Прочитать все</button>
                    )}
                  </div>
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifications.map((n) => {
                      const cfg = notifConfig[n.type];
                      return (
                        <div
                          key={n.id}
                          onClick={() => { markAllRead(n.id); if (n.link) { navigate(n.link); setShowNotifications(false); } }}
                          className="flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
                          style={{ borderColor: 'var(--iris-border-subtle)', background: n.read ? 'transparent' : 'var(--iris-bg-hover)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
                          onMouseLeave={(e) => { if (!n.read) e.currentTarget.style.background = 'var(--iris-bg-hover)'; else e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div className="mt-0.5 shrink-0">
                            <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium" style={{ color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#FF6B6B' }} />}
                            </div>
                            <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.description}</p>
                            <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>{n.time}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-4 py-2 border-t text-center" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                    <button onClick={() => { navigate('/workflow'); setShowNotifications(false); }} className="text-xs hover:underline" style={{ color: 'var(--iris-accent-blue)' }}>Все уведомления →</button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150"
                style={{ color: 'var(--text-primary)' }}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                onMouseLeave={(e) => { if (!showUserMenu) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: '#3B82F6' }}>
                  <User size={16} color="white" />
                </div>
                <span className="hidden md:inline">{t("admin", lang)}</span>
                <ChevronDown size={16} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border shadow-lg" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--iris-shadow-lg)' }} role="menu">
                  <div className="border-b px-4 py-3" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                    <div className="font-semibold">Администратор</div>
                    <div className="text-sm" style={{ color: 'var(--text-muted)' }}>admin@iris-demo.com</div>
                  </div>
                  <div className="p-2">
                    {/* ИСПРАВЛЕНО: добавлен onClick с navigate */}
                    <button 
                      type="button" 
                      onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all" 
                      style={{ color: 'var(--text-primary)' }} 
                      role="menuitem"
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <User size={16} style={{ color: '#3B82F6' }} /> 
                      Профиль
                    </button>
                    
                    <button 
                      type="button" 
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all" 
                      style={{ color: '#F87171' }} 
                      role="menuitem" 
                      onClick={handleLogout}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <LogOut size={16} /> 
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== NAVIGATION TABS ===== */}
      <div className="border-b" style={{ background: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <nav className="flex items-center gap-1 overflow-x-auto py-2" aria-label="Главная навигация">
            {navItems.map((item) => {
              const active = isActive(item.to);
              return (
                <Link key={item.to} to={item.to}
                  className="relative px-2 sm:px-4 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap"
                  style={{ color: active ? item.color : 'var(--text-secondary)', backgroundColor: active ? item.bgActive : 'transparent' }}
                  onMouseEnter={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                  onMouseLeave={(e) => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span style={{ color: active ? item.color : 'var(--text-secondary)' }}>{item.icon}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 px-4 py-6 md:px-6" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
        <div className="mx-auto w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}