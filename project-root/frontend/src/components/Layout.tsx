import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Bell, User, LogOut, ChevronDown,
  BarChart3, FolderKanban, FileText, ArrowLeftRight, Archive,
  Search, X,
} from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguageContext } from "@/features/profile/i18n/LanguageContext";
import { t } from "@/features/profile/i18n/translations";
import { useZoomStore, MIN_SCALE, MAX_SCALE } from "@/features/zoom/store/zoomStore";

/* ── Nav items ── */
const navItems = [
  { to: '/dashboard', label: 'Панель аналитики', icon: <BarChart3 size={16} />, color: '#3B82F6', bgActive: 'rgba(59, 130, 246, 0.15)' },
  { to: '/projects', label: 'Портфель заказов', icon: <FolderKanban size={16} />, color: '#8B5CF6', bgActive: 'rgba(139, 92, 246, 0.15)' },
  { to: '/documents', label: 'Документация', icon: <FileText size={16} />, color: '#4F7A4C', bgActive: 'rgba(79, 122, 76, 0.15)' },
  { to: '/workflow', label: 'Документооборот', icon: <ArrowLeftRight size={16} />, color: '#D4AF37', bgActive: 'rgba(212, 175, 55, 0.15)' },
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
  { id: 'n7', type: 'remark',    title: 'Новое замечание',      description: 'КЖ-02-014: критичное замечание требует проверки', time: '10 мин назад',  read: false, link: '/workflow' },
  { id: 'n8', type: 'approval',  title: 'Документ согласован',  description: 'АР-03-015 утверждён и готов к выпуску',          time: '1 ч назад',    read: false, link: '/documents' },
  { id: 'n9', type: 'system',    title: 'Упоминание в проекте', description: 'Вас упомянули в обсуждении ТЭЦ-5',               time: '2 ч назад',    read: false, link: '/projects' },
  { id: 'n1', type: 'remark',    title: 'Новое замечание',      description: 'КЖ-01-001: несоответствие арматуры в узле',     time: '5 мин назад',  read: true, link: '/workflow' },
  { id: 'n2', type: 'approval',  title: 'Документ согласован',  description: 'АР-03-015 утверждён ГИП',                        time: '30 мин назад', read: true, link: '/documents' },
  { id: 'n3', type: 'deadline',  title: 'Дедлайн приближается', description: 'Тендер ТЭЦ-5 — раскрытие через 2 дня',          time: '2 ч назад',    read: true, link: '/projects' },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const zoomSliderRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark';
  const unreadCount = notifications.filter(n => !n.read).length;

  const scale = useZoomStore((state) => state.scale);
  const setScale = useZoomStore((state) => state.setScale);

  const updateScaleFromMouse = (clientX: number) => {
    if (!zoomSliderRef.current) return;
    const rect = zoomSliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = x / rect.width;
    const raw = MIN_SCALE + pct * (MAX_SCALE - MIN_SCALE);
    const stepped = Math.round(raw / 0.05) * 0.05;
    setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, stepped)));
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => { if (isDraggingZoom) updateScaleFromMouse(e.clientX); };
    const handleUp = () => setIsDraggingZoom(false);
    if (isDraggingZoom) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingZoom]);

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

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const handleLogout = () => { setShowUserMenu(false); navigate('/login'); };
  const { lang } = useLanguageContext();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    /* ═══════════════════════════════════════
       КОРЕНЬ: zoom вместо transform: scale
       + h-screen для sticky внутри
       ═══════════════════════════════════════ */
    <div
      className="flex flex-col min-h-screen"
      style={{
        zoom: scale,
        background: 'var(--layout-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ═══ STICKY ШАПКА — закрепляется при скролле ═══ */}
      <div className="sticky top-0 z-50 shrink-0" style={{ background: 'var(--header-bg)' }}>
        
        {/* ===== ВЕРХНИЙ БАР ===== */}
        <header className="shrink-0 border-b" style={{ borderColor: 'var(--header-border)' }}>
          <div className="w-full flex min-h-14 items-center justify-between gap-4 px-4 md:px-6">
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
              {/* ── Масштаб (Word-style) ── */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <Search size={14} style={{ color: 'var(--text-muted)' }} />
                <button
                  onClick={() => setScale(Math.max(scale - 0.1, MIN_SCALE))}
                  className="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  −
                </button>
                <div
                  ref={zoomSliderRef}
                  className="relative w-20 h-4 select-none"
                  style={{ cursor: isDraggingZoom ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => { setIsDraggingZoom(true); updateScaleFromMouse(e.clientX); }}
                >
                  <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }} />
                  <div
                    className="absolute top-1/2 h-2 w-px -translate-y-1/2"
                    style={{
                      left: `${((1.0 - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%`,
                      background: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)',
                    }}
                  />
                  <div
                    className="absolute top-1/2 h-3 w-1 -translate-y-1/2 -translate-x-1/2 rounded-sm"
                    style={{
                      left: `${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%`,
                      background: isDraggingZoom ? (isDark ? '#60A5FA' : '#2563EB') : (isDark ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)'),
                      boxShadow: isDraggingZoom ? (isDark ? '0 0 0 3px rgba(96,165,250,0.4)' : '0 0 0 2px rgba(37,99,235,0.3)') : 'none',
                    }}
                  />
                </div>
                <button
                  onClick={() => setScale(Math.min(scale + 0.1, MAX_SCALE))}
                  className="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  +
                </button>
                <span className="text-[11px] font-sans tabular-nums select-none min-w-[28px] text-right" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150"
                style={{ color: 'var(--text-secondary)' }}
                aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
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

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border shadow-lg overflow-hidden" style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)', boxShadow: 'var(--iris-shadow-lg)', zIndex: 50 }}>
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
                          <div key={n.id}
                            onClick={() => { markAsRead(n.id); if (n.link) { navigate(n.link); setShowNotifications(false); } }}
                            className="flex gap-3 px-4 py-3 cursor-pointer transition-colors border-b"
                            style={{ borderColor: 'var(--iris-border-subtle)', background: n.read ? 'transparent' : 'var(--iris-bg-hover)' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
                            onMouseLeave={(e) => { if (!n.read) e.currentTarget.style.background = 'var(--iris-bg-hover)'; else e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div className="mt-0.5 shrink-0"><div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} /></div>
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
                      <button type="button" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all"
                        style={{ color: 'var(--text-primary)' }} role="menuitem"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <User size={16} style={{ color: '#3B82F6' }} /> Профиль
                      </button>
                      <button type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all"
                        style={{ color: '#F87171' }} role="menuitem" onClick={handleLogout}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(248, 113, 113, 0.15)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <LogOut size={16} /> Выйти
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ===== ТАБЫ + ГЛОБАЛЬНЫЙ ПОИСК ===== */}
        <div className="shrink-0 border-b" style={{ borderColor: 'var(--header-border)' }}>
          <div className="w-full px-4 md:px-6 flex items-center justify-between gap-4">
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
                      <span style={{ color: item.color }}>{item.icon}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                    </span>
                    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />}
                  </Link>
                );
              })}
            </nav>

            {/* Глобальный поиск */}
            <div className="relative shrink-0 w-full max-w-[180px] sm:max-w-[240px] md:max-w-[320px]">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
                placeholder="Поиск..."
                className="w-full rounded-lg border pl-8 pr-7 py-1.5 text-sm outline-none transition-colors"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-engineering)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ===== КОНТЕНТ ===== */}
      <main className="flex-auto overflow-auto min-h-0">
        <Outlet />
      </main>
    </div>
  );
}