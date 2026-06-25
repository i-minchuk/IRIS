import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

/* ── Prefetch часто используемых страниц ── */
const prefetchDashboard = () => import('@/pages/Dashboard');
const prefetchDocuments = () => import('@/pages/DocumentsPage');
import {
  User, LogOut, ChevronDown, X,
  BarChart3, FileText, Archive,
  Search, Shield, Briefcase, Factory,
  BookOpen, Settings,
} from 'lucide-react';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguageContext } from "@/features/profile/i18n/LanguageContext";
import { t } from "@/features/profile/i18n/translations";
import { useZoomStore, MIN_SCALE, MAX_SCALE } from "@/features/zoom/store/zoomStore";
import { useAuth } from '@/context/useAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import type { UserRole } from '@/features/auth/store/authStore';

/* ── Role-based nav config ── */
const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Панель аналитики', shortLabel: 'Аналитика', iconOnly: false, icon: <BarChart3 size={16} />, color: '#3B82F6', bgActive: 'rgba(59, 130, 246, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'site_manager', 'engineer', 'norm_controller', 'admin'] },
  { to: '/portfolio', label: 'Портфель заказов', shortLabel: 'Портфель', iconOnly: false, icon: <Briefcase size={16} />, color: '#7C3AED', bgActive: 'rgba(124, 58, 237, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
  { to: '/documents', label: 'Документация', shortLabel: 'Документы', iconOnly: false, icon: <FileText size={16} />, color: '#4F7A4C', bgActive: 'rgba(79, 122, 76, 0.15)', roles: ['department_head', 'gip', 'site_manager', 'engineer', 'norm_controller', 'manager', 'admin'] },
  { to: '/production', label: 'Производственный контроль', shortLabel: 'Пр-во', iconOnly: false, icon: <Factory size={16} />, color: '#F59E0B', bgActive: 'rgba(245, 158, 11, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
  { to: '/archive', label: 'Архив', shortLabel: 'Архив', iconOnly: false, icon: <Archive size={16} />, color: '#6B7280', bgActive: 'rgba(107, 114, 128, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'site_manager', 'engineer', 'norm_controller', 'manager', 'admin'] },
  { to: '/admin', label: 'Администрирование', shortLabel: 'Админ', iconOnly: false, icon: <Shield size={16} />, color: '#FF6B6B', bgActive: 'rgba(255, 107, 107, 0.15)', roles: ['admin', 'product_owner', 'system_admin', 'tech_support', 'content_editor'] },
  { to: '/references', label: 'Справочники', shortLabel: 'Справочн.', iconOnly: false, icon: <BookOpen size={16} />, color: '#14B8A6', bgActive: 'rgba(20, 184, 166, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
  { to: '/reports', label: 'Отчёты', shortLabel: 'Отчёты', iconOnly: false, icon: <FileText size={16} />, color: '#EC4899', bgActive: 'rgba(236, 72, 153, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
];

function getNavItems(role: UserRole | undefined) {
  if (!role) return ALL_NAV_ITEMS.filter(item => item.to === '/dashboard');
  if (role === 'admin') return ALL_NAV_ITEMS;
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
}



export default function Layout() {
  const { theme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('iris_profile_avatar');
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isDraggingZoom, setIsDraggingZoom] = useState(false);
  const zoomSliderRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  const { user } = useAuth();
  const navItems = getNavItems(user?.role);

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
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  /* Prefetch после монтирования Layout (пользователь залогинен) */
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchDashboard();
      prefetchDocuments();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    useAuthStore.getState().logout();
    navigate('/login');
  };
  const { lang } = useLanguageContext();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        zoom: scale,
        background: 'var(--layout-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* ═══ STICKY ШАПКА ═══ */}
      <div className="sticky top-0 z-50 shrink-0" style={{ background: 'var(--header-bg)' }}>
        
        {/* ===== ВЕРХНИЙ БАР ===== */}
        <header className="shrink-0 border-b" style={{ borderColor: 'var(--header-border)' }}>
          <div className="w-full flex min-h-14 items-center justify-between gap-4 px-4 md:px-6">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3 no-underline shrink-0">
              <img src="/icon-iris.png" alt="ДокПоток IRIS" className="h-9 w-9 rounded-lg object-contain" />
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
                <span className="text-sm font-sans tabular-nums select-none min-w-[28px] text-right" style={{ color: 'var(--text-secondary)' }}>
                  {Math.round(scale * 100)}%
                </span>
              </div>

              {/* Notifications */}
              <NotificationBell />

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
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden text-xs font-bold"
                    style={{
                      background: avatarUrl ? 'transparent' : '#3B82F6',
                      color: 'white',
                      border: avatarUrl ? '2px solid var(--border-default)' : 'none',
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} color="white" />
                    )}
                  </div>
                  <span className="hidden md:inline">{t("admin", lang)}</span>
                  <ChevronDown size={16} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl border shadow-lg" style={{ background: 'var(--iris-bg-surface)', backgroundColor: isDark ? '#1e1e2e' : '#ffffff', borderColor: 'var(--iris-border-subtle)', color: 'var(--text-primary)', boxShadow: 'var(--iris-shadow-lg)', zIndex: 100 }} role="menu">
                    <div className="border-b px-4 py-3" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                      <div className="font-semibold">{user?.full_name || user?.username || 'Пользователь'}</div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.email || ''}</div>
                      <div className="text-xs mt-0.5 px-1.5 py-0.5 rounded-full inline-block" style={{ background: 'var(--iris-bg-hover)', color: 'var(--text-muted)' }}>{user?.role || 'engineer'}</div>
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={() => { navigate('/profile'); setShowUserMenu(false); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all"
                        style={{ color: 'var(--text-primary)' }} role="menuitem"
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <Settings size={16} style={{ color: '#3B82F6' }} /> Настройки профиля
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

        {/* ===== ЦВЕТНАЯ ЛИНИЯ НАВЕРХУ ===== */}
        <div className="shrink-0 h-0.5 w-full relative" style={{ background: 'var(--header-border)' }}>
          {navItems.map((item) => {
            const active = isActive(item.to);
            return active ? (
              <div
                key={`line-${item.to}`}
                className="absolute top-0 h-full transition-all duration-300"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 12px ${item.color}66`,
                  left: 0,
                  right: 0,
                  width: '100%',
                }}
              />
            ) : null;
          })}
        </div>

        {/* ===== ТАБЫ + ГЛОБАЛЬНЫЙ ПОИСК ===== */}
        <div className="shrink-0 relative pt-3" style={{ borderColor: 'var(--header-border)' }}>
          {/* Background "stacked" tabs effect - inactive tabs peeking behind */}
          <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none overflow-hidden">
            {navItems.map((item, idx) => {
              const active = isActive(item.to);
              if (active) return null;
              // Each inactive tab peeks from behind with offset
              const offset = (navItems.length - idx) * 3;
              return (
                <div
                  key={`bg-${item.to}`}
                  className="absolute bottom-0 h-8 rounded-t-lg"
                  style={{
                    left: `${idx * 12 + offset}px`,
                    width: '80px',
                    backgroundColor: item.bgActive.replace('0.15', '0.08'),
                    borderTop: `2px solid ${item.color}44`,
                    borderLeft: '1px solid var(--iris-border-subtle)',
                    borderRight: '1px solid var(--iris-border-subtle)',
                    zIndex: idx,
                    transform: `translateY(${offset}px)`,
                  }}
                />
              );
            })}
          </div>

          <div className="w-full px-4 md:px-6 flex items-end justify-between gap-4 relative z-10">
            <nav className="flex items-end gap-0" aria-label="Главная навигация">
              {/* Табы — стиль папок-ярлыков */}
              {navItems.map((item, idx) => {
                const active = isActive(item.to);
                const iconOnly = (item as any).iconOnly;
                // Folder tab style: rounded top, flat bottom, peeking effect
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`
                      group relative font-medium transition-all duration-200
                      flex items-center gap-1.5
                      ${active
                        ? 'z-20 px-3 py-2 text-sm'
                        : 'z-10 px-2 py-1.5 text-xs hover:z-30'
                      }
                    `}
                    style={{
                      color: active ? item.color : 'var(--text-secondary)',
                      backgroundColor: active ? 'var(--iris-bg-surface)' : 'transparent',
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                      borderBottom: active ? 'none' : '1px solid var(--iris-border-subtle)',
                      borderTop: active ? `3px solid ${item.color}` : `2px solid ${item.color}44`,
                      borderLeft: active ? '1px solid var(--iris-border-subtle)' : '1px solid transparent',
                      borderRight: active ? '1px solid var(--iris-border-subtle)' : '1px solid transparent',
                      marginLeft: idx > 0 ? '-6px' : '0',
                      transform: active ? 'translateY(0)' : `translateY(${2 + idx}px)`,
                      boxShadow: active
                        ? `0 -2px 6px ${item.color}18, 0 0 0 1px var(--iris-border-subtle)`
                        : 'none',
                      zIndex: active ? 20 : 10 - idx,
                      paddingBottom: active ? '10px' : '6px',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.zIndex = '25';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.transform = `translateY(${2 + idx}px)`;
                        e.currentTarget.style.zIndex = '10';
                      }
                    }}
                    aria-current={active ? 'page' : undefined}
                    title={item.label}
                  >
                    <span style={{ color: item.color, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                    {!iconOnly && (
                      <>
                        {/* Ноутбук: полные названия */}
                        <span className="hidden lg:inline-block xl:hidden whitespace-nowrap">{item.shortLabel || item.label}</span>
                        {/* Десктоп: полные названия */}
                        <span className="hidden xl:inline-block whitespace-nowrap">{item.label}</span>
                      </>
                    )}
                    {iconOnly && (
                      <span className="hidden xl:inline-block whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Глобальный поиск */}
            <div className="relative shrink-0 w-full max-w-[120px] lg:max-w-[160px] xl:max-w-[200px] mb-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                id="global-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
                placeholder="Поиск"
                title="Глобальный поиск (Ctrl+K)"
                className="w-full rounded-lg border pl-8 pr-6 py-1.5 text-xs outline-none transition-colors"
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
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
          {/* Bottom border line */}
          <div className="h-px w-full" style={{ backgroundColor: 'var(--iris-border-subtle)' }} />
        </div>

        {/* ===== BREADCRUMBS ===== */}
        {location.pathname !== '/dashboard' && <Breadcrumbs />}
      </div>

      {/* ===== КОНТЕНТ ===== */}
      <main className="flex-auto overflow-y-auto overflow-x-hidden min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
