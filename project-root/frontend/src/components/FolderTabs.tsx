import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';

interface TabItem {
  path: string;
  label: string;
  lightBg: string;
  darkBg: string;
  lightText: string;
  darkText: string;
}

const tabs: TabItem[] = [
  {
    path: '/dashboard',
    label: 'Панель аналитики и контроля',
    lightBg: '#3B4FA8',
    darkBg: '#5C75E0',
    lightText: '#FFFFFF',
    darkText: '#FFFFFF',
  },
  {
    path: '/projects',
    label: 'Портфель проектов',
    lightBg: '#8D79C7',
    darkBg: '#A898D9',
    lightText: '#FFFFFF',
    darkText: '#FFFFFF',
  },
  {
    path: '/documents',
    label: 'Пакет документации',
    lightBg: '#3498DB',
    darkBg: '#5DADE2',
    lightText: '#FFFFFF',
    darkText: '#FFFFFF',
  },
  {
    path: '/approval',
    label: 'Согласования',
    lightBg: '#D4A62A',
    darkBg: '#E8C44A',
    lightText: '#1E2230',
    darkText: '#1E2230',
  },
  {
    path: '/remarks',
    label: 'Замечания',
    lightBg: '#C0392B',
    darkBg: '#E74C3C',
    lightText: '#FFFFFF',
    darkText: '#FFFFFF',
  },
  {
    path: '/archive',
    label: 'Архив',
    lightBg: '#A0A8B8',
    darkBg: '#5A6270',
    lightText: '#FFFFFF',
    darkText: '#FFFFFF',
  },
];

export const FolderTabs = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav className="flex items-end gap-0 pt-4 bg-[#F5F7FA] dark:bg-[#0B1220] overflow-x-auto folder-tabs-scroll">
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={[
              'relative flex items-center px-3 sm:px-4 lg:px-3 py-2.5 sm:py-3 lg:py-2.5 rounded-t-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0',
              isActive
                ? 'font-bold -translate-y-0.5 shadow-md z-10'
                : 'opacity-80 hover:opacity-100 hover:-translate-y-0.5',
            ].join(' ')}
            style={
              isActive
                ? {
                    backgroundColor: isDark ? tab.darkBg : tab.lightBg,
                    color: isDark ? tab.darkText : tab.lightText,
                  }
                : {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(30,34,48,0.06)',
                    color: isDark ? '#94A3B8' : '#64748B',
                  }
            }
          >
            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
};
