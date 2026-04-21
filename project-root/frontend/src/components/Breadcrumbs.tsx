import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

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
  new: 'Новый',
  admin: 'Администрирование',
  users: 'Пользователи',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-[var(--text-muted)]">
      <Link to="/dashboard" className="hover:text-[var(--primary)] transition-colors">
        <Home size={16} />
      </Link>
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const label = ROUTE_LABELS[value] || value;

        return (
          <div key={to} className="flex items-center space-x-2">
            <ChevronRight size={14} className="text-[var(--border)]" />
            {last ? (
              <span className="font-medium text-[var(--text-base)] truncate max-w-[200px]">
                {label}
              </span>
            ) : (
              <Link to={to} className="hover:text-[var(--primary)] transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
