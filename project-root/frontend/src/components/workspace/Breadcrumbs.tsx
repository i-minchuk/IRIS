import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Дашборд',
  documents: 'Документы',
  tasks: 'Задачи',
  import: 'Импорт Excel',
  workload: 'Загруженность',
  tender: 'Оценка тендера',
  achievements: 'Достижения',
  leaderboard: 'Лидерборд',
  profile: 'Мой кабинет',
  projects: 'Проекты',
  project: 'Проект',
  new: 'Новый',
  admin: 'Администрирование',
  users: 'Пользователи',
  groups: 'Инженерные группы',
};

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  const breadcrumbs: BreadcrumbItem[] = pathnames.map((value, index) => {
    const last = index === pathnames.length - 1;
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    const label = ROUTE_LABELS[value] || formatLabel(value);

    return {
      label,
      to: last ? undefined : to,
    };
  });

  return (
    <nav
      className="flex items-center gap-1 px-3 py-1.5 text-sm overflow-x-auto"
      style={{
        backgroundColor: 'var(--bg-surface-2)',
        borderBottom: '1px solid var(--border-default)',
      }}
      aria-label="Хлебные крошки"
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="Домой"
      >
        <Home size={14} />
      </Link>

      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={index} className="flex items-center gap-1 flex-nowrap">
            <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
            {crumb.to && !isLast ? (
              <Link
                to={crumb.to}
                className="px-1.5 py-1 rounded hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap"
                style={{ color: 'var(--text-secondary)' }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="px-1.5 py-1 font-medium whitespace-nowrap truncate max-w-[200px]"
                style={{ color: 'var(--text-primary)' }}
              >
                {crumb.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function formatLabel(value: string): string {
  // Преобразование kebab-case в Normal Case
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
