import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

/* ── Prefetch часто используемых страниц ── */
const prefetchDashboard = () => import('@/pages/Dashboard');
const prefetchDocuments = () => import('@/pages/DocumentsPage');
import {
  User, LogOut, ChevronDown,
  BarChart3, FileText, Archive,
  Shield, Briefcase, Factory,
  BookOpen, Settings, MessageSquareWarning,
} from 'lucide-react';
import { toast } from 'sonner';

import { useTheme } from '@/providers/ThemeProvider';
import { useLanguageContext } from "@/features/profile/i18n/LanguageContext";
import { t } from "@/features/profile/i18n/translations";
import { useZoomStore } from "@/features/zoom/store/zoomStore";
import { useAuth } from '@/context/useAuth';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAppModeStore } from '@/stores/appModeStore';
import client from '@/shared/api/client';
import Breadcrumbs from '@/components/Breadcrumbs';
import NotificationBell from '@/features/notifications/components/NotificationBell';
import GlobalSearch from '@/components/GlobalSearch';
import { useGlobalSearchStore } from '@/stores/globalSearchStore';
import type { UserRole } from '@/features/auth/store/authStore';

/* ── Role-based nav config ── */
const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Панель аналитики', shortLabel: 'Аналитика', iconOnly: false, icon: <BarChart3 size={16} />, color: '#3B82F6', bgActive: 'rgba(59, 130, 246, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'site_manager', 'engineer', 'norm_controller', 'admin'] },
  { to: '/portfolio', label: 'Портфель заказов', shortLabel: 'Портфель', iconOnly: false, icon: <Briefcase size={16} />, color: '#7C3AED', bgActive: 'rgba(124, 58, 237, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
  { to: '/documents', label: 'Документация', shortLabel: 'Документы', iconOnly: false, icon: <FileText size={16} />, color: '#4F7A4C', bgActive: 'rgba(79, 122, 76, 0.15)', roles: ['department_head', 'gip', 'site_manager', 'engineer', 'norm_controller', 'manager', 'admin'] },
  { to: '/production', label: 'Производственный контроль', shortLabel: 'Пр-во', iconOnly: false, icon: <Factory size={16} />, color: '#F59E0B', bgActive: 'rgba(245, 158, 11, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
  { to: '/archive', label: 'Архив', shortLabel: 'Архив', iconOnly: false, icon: <Archive size={16} />, color: '#6B7280', bgActive: 'rgba(107, 114, 128, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'site_manager', 'engineer', 'norm_controller', 'manager', 'admin'] },
  { to: '/admin', label: 'Администрирование', shortLabel: 'Админ', iconOnly: false, icon: <Shield size={16} />, color: '#FF6B6B', bgActive: 'rgba(255, 107, 107, 0.15)', roles: ['admin', 'product_owner', 'system_admin', 'tech_support', 'content_editor'] },
  { to: '/references?tab=contacts', label: 'Справочники', shortLabel: 'Справочн.', iconOnly: false, icon: <BookOpen size={16} />, color: '#14B8A6', bgActive: 'rgba(20, 184, 166, 0.15)', roles: ['director', 'deputy_director', 'department_head', 'gip', 'manager', 'engineer', 'site_manager', 'norm_controller', 'admin'] },
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
  const navigate = useNavigate();
  const location = useLocation();
  const setActiveTab = useGlobalSearchStore((state) => state.setActiveTab);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  const { user } = useAuth();
  const navItems = getNavItems(user?.role);

  /* ── Режим работы (demo/prod) ── */
  const meta = useAppModeStore((s) => s.meta);
  const fetchMeta = useAppModeStore((s) => s.fetchMeta);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSending, setFeedbackSending] = useState(false);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  const submitFeedback = async () => {
    if (!feedbackText.trim()) return;
    setFeedbackSending(true);
    try {
      await client.post('/support/tickets', {
        title: feedbackText.trim().slice(0, 80),
        description: feedbackText.trim(),
        requester: user?.email || 'unknown',
        priority: 'medium',
        category: 'feedback',
      });
      toast.success('Спасибо! Обращение отправлено.');
      setFeedbackText('');
      setShowFeedback(false);
    } catch {
      toast.error('Не удалось отправить обращение');
    } finally {
      setFeedbackSending(false);
    }
  };

  const scale = useZoomStore((state) => state.scale);

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

  useEffect(() => {
    const activeItem = navItems.find((item) => isActive(item.to));
    setActiveTab(activeItem?.to ?? null);
  }, [location.pathname, navItems, setActiveTab]);

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
              {/* Feedback (prod-режим) */}
              {meta?.features.feedback_button && (
                <button
                  type="button"
                  onClick={() => setShowFeedback(true)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-all"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Сообщить о проблеме"
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <MessageSquareWarning size={16} />
                  <span className="hidden xl:inline">Сообщить о проблеме</span>
                </button>
              )}

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
          <div className="w-full px-4 md:px-6 flex items-end justify-between gap-4 relative z-10">
            <nav className="flex items-end gap-2 lg:gap-1 xl:gap-3 2xl:gap-2" aria-label="Главная навигация">
              {navItems.map((item) => {
                const active = isActive(item.to);
                const iconOnly = (item as any).iconOnly;
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
                      backgroundColor: active ? 'var(--iris-bg-surface)' : 'var(--iris-bg-app)',
                      borderTopLeftRadius: '10px',
                      borderTopRightRadius: '10px',
                      borderBottom: active ? '1px solid var(--iris-bg-surface)' : '1px solid var(--iris-border-subtle)',
                      borderTop: active ? `3px solid ${item.color}` : `2px solid ${item.color}44`,
                      borderLeft: '1px solid var(--iris-border-subtle)',
                      borderRight: '1px solid var(--iris-border-subtle)',
                      transform: active ? 'translateY(0)' : 'translateY(2px)',
                      boxShadow: active
                        ? `0 -2px 6px ${item.color}18, 0 0 0 1px var(--iris-border-subtle)`
                        : 'none',
                      zIndex: active ? 20 : 10,
                      paddingBottom: active ? '10px' : '8px',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.zIndex = '25';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--iris-bg-app)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.transform = 'translateY(2px)';
                        e.currentTarget.style.zIndex = '10';
                      }
                    }}
                    aria-current={active ? 'page' : undefined}
                    title={item.label}
                  >
                    <span style={{ color: item.color, opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                    {!iconOnly && (
                      <>
                        {/* Ноутбук: короткие названия */}
                        <span className="hidden lg:inline-block 2xl:hidden whitespace-nowrap">{item.shortLabel || item.label}</span>
                        {/* Десктоп: полные названия */}
                        <span className="hidden 2xl:inline-block whitespace-nowrap">{item.label}</span>
                      </>
                    )}
                    {iconOnly && (
                      <span className="hidden 2xl:inline-block whitespace-nowrap">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Глобальный поиск */}
            <div className="relative shrink-0 w-full max-w-[180px] lg:max-w-[150px] xl:max-w-[220px] 2xl:max-w-[240px] mb-1">
              <GlobalSearch />
            </div>
          </div>
          {/* Bottom border line */}
          <div className="h-px w-full" style={{ backgroundColor: 'var(--iris-border-subtle)' }} />
        </div>

        {/* ===== BREADCRUMBS ===== */}
        {location.pathname !== '/dashboard' && <Breadcrumbs />}
      </div>

      {/* ===== КОНТЕНТ ===== */}
      {meta?.features.demo_banner && (
        <div
          className="shrink-0 px-4 py-1.5 text-center text-xs font-medium"
          style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#B45309', borderBottom: '1px solid rgba(245, 158, 11, 0.3)' }}
        >
          Демо-режим: все данные вымышленные, экспорт и внешние интеграции отключены
        </div>
      )}
      <main className="flex-auto overflow-y-auto overflow-x-hidden min-h-0">
        <Outlet />
      </main>

      {/* ===== МОДАЛКА ФИДБЕКА (prod-режим) ===== */}
      {showFeedback && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowFeedback(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border p-4"
            style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Сообщить о проблеме
            </h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Опишите проблему или предложение…"
              rows={4}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none resize-y"
              style={{
                background: 'var(--iris-bg-app)',
                borderColor: 'var(--iris-border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowFeedback(false)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitFeedback}
                disabled={feedbackSending || !feedbackText.trim()}
                className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: '#3B82F6', color: '#fff' }}
              >
                {feedbackSending ? 'Отправка…' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
