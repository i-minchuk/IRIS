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
      className="flex items-end gap-1 px-4 sm:px-6 lg:px-8 overflow-x-auto"
      style={{
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className="relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0"
            style={
              isActive
                ? {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#1e2230',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                    borderBottom: 'none',
                    borderRadius: '2px 2px 0 0',
                    transform: 'translateY(-2px)',
                    zIndex: 10,
                    boxShadow: `0 -2px 8px ${tab.color}40, 0 0 16px ${tab.color}25, inset 0 1px 0 ${tab.color}30`,
                  }
                : {
                    backgroundColor: 'transparent',
                    color: isDark ? '#64748b' : '#64748b',
                    border: '1px solid transparent',
                    borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
                    borderRadius: '2px 2px 0 0',
                    transform: 'translateY(0)',
                    zIndex: 1,
                  }
            }
            title={tab.label}
          >
            <span style={{ color: tab.color }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
