import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Панель аналитики',
  tenders: 'Тендеры',
  portfolio: 'Портфель заказов',
  documents: 'Документация',
  workflow: 'Документооборот',
  remarks: 'Замечания',
  archive: 'Архив',
  achievements: 'Достижения',
  calendar: 'Календарь',
  reports: 'Отчёты',
  profile: 'Профиль',
  admin: 'Администрирование',
  projects: 'Проекты',
  tasks: 'Задачи',
  import: 'Импорт Excel',
  workload: 'Загруженность',
  tender: 'Оценка тендера',
  leaderboard: 'Лидерборд',
  new: 'Новый',
  users: 'Пользователи',
  groups: 'Инженерные группы',
  production: 'Производственный контроль',
  package: 'Пакет документации',
  'project-portfolio': 'Портфель проектов',
  'project-tasks': 'Задачи по проектам',
  references: 'Справочники',
};

interface BreadcrumbItem {
  label: string;
  to?: string;
}

function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
      className="flex items-center gap-1 px-4 md:px-6 py-1.5 text-sm overflow-x-auto"
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
        title="Главная"
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
