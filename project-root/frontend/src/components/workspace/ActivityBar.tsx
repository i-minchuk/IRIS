import {
  Home,
  FolderOpen,
  FileText,
  CheckSquare,
  MessageSquare,
  Bell,
  Settings,
  Search,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspaceStore } from './store/workspaceStore';

interface ActivityBarItem {
  icon: React.ReactNode;
  label: string;
  to?: string;
  onClick?: () => void;
  badge?: number;
}

const ACTIVITY_ITEMS: ActivityBarItem[] = [
  {
    icon: <Home size={20} />,
    label: 'Дашборд',
    to: '/dashboard',
  },
  {
    icon: <FolderOpen size={20} />,
    label: 'Проекты',
    to: '/projects',
  },
  {
    icon: <FileText size={20} />,
    label: 'Документы',
    to: '/documents',
  },
  {
    icon: <CheckSquare size={20} />,
    label: 'Задачи',
    to: '/tasks',
  },
  {
    icon: <MessageSquare size={20} />,
    label: 'Замечания',
    badge: 3,
  },
  {
    icon: <Bell size={20} />,
    label: 'Уведомления',
    badge: 5,
  },
  {
    icon: <Settings size={20} />,
    label: 'Настройки',
  },
];

export default function ActivityBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { explorerCollapsed, toggleExplorer } = useWorkspaceStore();

  const handleClick = (item: ActivityBarItem) => {
    if (item.to) {
      navigate(item.to);
    }
    if (item.onClick) {
      item.onClick();
    }
  };

  return (
    <aside
      className="flex flex-col items-center py-4 border-r shrink-0 z-50"
      style={{
        width: '56px',
        backgroundColor: 'var(--bg-topbar)',
        borderColor: 'var(--border-default)',
      }}
      aria-label="Панель активностей"
    >
      <nav className="flex flex-col gap-2 w-full px-2" role="navigation">
        {ACTIVITY_ITEMS.map((item, index) => {
          const isActive = item.to
            ? location.pathname === item.to ||
              (item.to !== '/projects' && location.pathname.startsWith(item.to))
            : false;

          return (
            <button
              key={index}
              onClick={() => handleClick(item)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 ${
                isActive ? '' : 'hover:opacity-100 opacity-70'
              }`}
              style={{
                color: isActive ? 'var(--accent-engineering)' : 'var(--topbar-icon)',
                backgroundColor: isActive ? 'var(--topbar-active)' : 'transparent',
              }}
              title={item.label}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--topbar-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.icon}

              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-semibold leading-none"
                  style={{
                    backgroundColor: 'var(--notification-badge)',
                    color: 'var(--text-inverse)',
                    border: '1px solid var(--bg-topbar)',
                  }}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 w-full px-2">
        <button
          onClick={toggleExplorer}
          className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-150 hover:opacity-100 opacity-70"
          style={{
            color: 'var(--topbar-icon)',
            backgroundColor: 'transparent',
          }}
          title={explorerCollapsed ? 'Показать Explorer' : 'Скрыть Explorer'}
          aria-label={explorerCollapsed ? 'Показать Explorer' : 'Скрыть Explorer'}
        >
          <Search size={18} />
        </button>
      </div>
    </aside>
  );
}
