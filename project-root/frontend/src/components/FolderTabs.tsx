import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '@/providers/ThemeProvider';
import { BarChart3, FolderKanban, FileText, ArrowLeftRight, Archive } from 'lucide-react';

interface TabItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const tabs: TabItem[] = [
  {
    path: '/dashboard',
    label: 'Панель аналитики',
    icon: <BarChart3 size={16} />,
    color: '#3B82F6',
  },
  {
    path: '/projects',
    label: 'Портфель заказов',
    icon: <FolderKanban size={16} />,
    color: '#8B5CF6',
  },
  {
    path: '/documents',
    label: 'Документация',
    icon: <FileText size={16} />,
    color: '#4F7A4C',
  },
  {
    path: '/workflow',
    label: 'Документооборот',
    icon: <ArrowLeftRight size={16} />,
    color: '#F59E0B',
  },
  {
    path: '/archive',
    label: 'Архив',
    icon: <Archive size={16} />,
    color: '#6B7280',
  },
];

export const FolderTabs = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <nav
      className="flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto"
      style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}
    >
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
            style={
              isActive
                ? {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#1e2230',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: isDark ? '#64748b' : '#64748b',
                  }
            }
            title={tab.label}
          >
            <span style={{ color: isActive ? tab.color : undefined, opacity: isActive ? 1 : 0.6 }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
