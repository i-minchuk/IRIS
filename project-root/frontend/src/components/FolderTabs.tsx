import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';

interface TabItem {
  path: string;
  label: string;
  shortLabel: string;
  color: string;
  glow: string;
}

const tabs: TabItem[] = [
  {
    path: '/dashboard',
    label: 'Панель аналитики и контроля',
    shortLabel: 'Аналитика',
    color: '#00F0FF',
    glow: 'rgba(0, 240, 255, 0.25)',
  },
  {
    path: '/portfolio',
    label: 'Портфель заказов',
    shortLabel: 'Заказы',
    color: '#00E676',
    glow: 'rgba(0, 230, 118, 0.25)',
  },
  {
    path: '/production',
    label: 'Производственный контроль',
    shortLabel: 'Производство',
    color: '#FF5722',
    glow: 'rgba(255, 87, 34, 0.25)',
  },
  {
    path: '/tasks',
    label: 'Задачи по проектам',
    shortLabel: 'Задачи',
    color: '#FF6B00',
    glow: 'rgba(255, 107, 0, 0.25)',
  },
  {
    path: '/packages',
    label: 'Пакет документации',
    shortLabel: 'Пакет',
    color: '#9C27B0',
    glow: 'rgba(156, 39, 176, 0.25)',
  },
  {
    path: '/workflow',
    label: 'Маршрут согласования',
    shortLabel: 'Согласование',
    color: '#00BCD4',
    glow: 'rgba(0, 188, 212, 0.25)',
  },
  {
    path: '/remarks',
    label: 'Замечания',
    shortLabel: 'Замечания',
    color: '#FF4D6D',
    glow: 'rgba(255, 77, 109, 0.25)',
  },
  {
    path: '/archive',
    label: 'Архив',
    shortLabel: 'Архив',
    color: '#8892A8',
    glow: 'rgba(136, 146, 168, 0.25)',
  },
];

export const FolderTabs = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav className="flex items-end gap-1.5 pt-2 sm:pt-4 overflow-x-auto folder-tabs-scroll snap-x snap-mandatory"
      style={{ background: isDark ? 'transparent' : '#F5F7FA' }}
    >
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={[
              'relative flex items-center px-2 sm:px-4 py-2 sm:py-3 rounded-t-lg text-[11px] sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 snap-start',
              isActive
                ? 'font-bold -translate-y-0.5 z-10'
                : 'opacity-70 hover:opacity-100 hover:-translate-y-0.5',
            ].join(' ')}
            style={
              isActive
                ? {
                    background: isDark
                      ? `linear-gradient(180deg, ${tab.color}22 0%, ${tab.color}11 100%)`
                      : tab.color,
                    color: isDark ? tab.color : '#fff',
                    boxShadow: isDark
                      ? `0 -4px 20px ${tab.glow}, inset 0 1px 0 ${tab.color}33`
                      : `0 -4px 20px ${tab.glow}`,
                    borderTop: isDark ? `2px solid ${tab.color}` : 'none',
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(30,34,48,0.06)',
                    color: isDark ? '#5A6380' : '#64748B',
                  }
            }
            title={tab.label}
          >
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
