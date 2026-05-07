import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { BarChart3, FolderKanban, FileText, ArrowLeftRight, Archive } from 'lucide-react';

interface TabItem {
  path: string;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
}

const tabs: TabItem[] = [
  {
    path: '/dashboard',
    label: 'Панель аналитики',
    shortLabel: 'Аналитика',
    icon: <BarChart3 size={18} />,
    color: '#3B82F6',
  },
  {
    path: '/projects',
    label: 'Портфель заказов',
    shortLabel: 'Заказы',
    icon: <FolderKanban size={18} />,
    color: '#8B5CF6',
  },
  {
    path: '/documents',
    label: 'Документация',
    shortLabel: 'Документы',
    icon: <FileText size={18} />,
    color: '#4F7A4C',
  },
  {
    path: '/workflow',
    label: 'Документооборот',
    shortLabel: 'Обработка',
    icon: <ArrowLeftRight size={18} />,
    color: '#F59E0B',
  },
  {
    path: '/archive',
    label: 'Архив',
    shortLabel: 'Архив',
    icon: <Archive size={18} />,
    color: '#6B7280',
  },
];

export const FolderTabs = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav className="flex items-end gap-1 pt-2 sm:pt-4 overflow-x-auto folder-tabs-scroll snap-x snap-mandatory px-4"
      style={{ background: isDark ? '#0f172a' : '#ffffff', borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}
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
              'relative flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-[11px] sm:text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 snap-start rounded-t-lg',
              isActive
                ? 'font-bold'
                : 'opacity-70 hover:opacity-100',
            ].join(' ')}
            style={
              isActive
                ? {
                    color: tab.color,
                    borderBottom: `3px solid ${tab.color}`,
                    backgroundColor: isDark ? `${tab.color}11` : `${tab.color}08`,
                  }
                : {
                    color: isDark ? '#94a3b8' : '#64748B',
                  }
            }
            title={tab.label}
          >
            <span style={{ color: isActive ? tab.color : undefined }}>{tab.icon}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
