import { NavLink, useLocation } from 'react-router-dom';

interface TabItem {
  path: string;
  label: string;
  color: string;
}

const tabs: TabItem[] = [
  { path: '/dashboard', label: 'Дашборд', color: '#D4A843' },
  { path: '/projects', label: 'Проекты', color: '#4F7A4C' },
  { path: '/documents', label: 'Документы', color: '#9B7EDE' },
  { path: '/approval', label: 'Согласование', color: '#8B9DAF' },
  { path: '/remarks', label: 'Замечания', color: '#C75B5B' },
  { path: '/analytics', label: 'Аналитика', color: '#5B8FC7' },
  { path: '/resources', label: 'Ресурсы', color: '#6B8E6B' },
  { path: '/tenders', label: 'Тендеры', color: '#B8956B' },
  { path: '/admin', label: 'Админ', color: '#6B7280' },
];

export const FolderTabs = () => {
  const location = useLocation();

  return (
    <nav className="flex items-end gap-2 px-4 sm:px-6 lg:px-8 pt-4 bg-[#F5F7FA] dark:bg-[#0B1220] overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive =
          location.pathname === tab.path ||
          location.pathname.startsWith(`${tab.path}/`);

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={[
              'relative flex items-center gap-2 px-4 sm:px-5 py-3 rounded-t-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0',
              isActive
                ? 'text-white font-bold -translate-y-0.5 shadow-md'
                : 'bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E2230] dark:hover:text-white border border-[#E2E8F0] dark:border-[#334155] border-b-0',
            ].join(' ')}
            style={isActive ? { backgroundColor: tab.color } : undefined}
          >
            {/* Цветная вертикальная полоска для неактивных */}
            {!isActive && (
              <span
                className="w-1 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: tab.color }}
              />
            )}

            {tab.label}
          </NavLink>
        );
      })}
    </nav>
  );
};
