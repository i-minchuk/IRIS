import React, { useEffect, useState } from 'react';
import { analyticsApi, type DashboardData, type ScorecardProject, type TeamMember } from '../api/analytics';

const KpiCard: React.FC<{ title: string; value: string | number; subtitle?: string; color: string }> = ({
  title,
  value,
  subtitle,
  color,
}) => (
  <div className={`rounded-lg border p-4 ${color}`}>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm font-medium mt-1">{title}</div>
    {subtitle && <div className="text-xs opacity-75 mt-0.5">{subtitle}</div>}
  </div>
);

const HealthDot: React.FC<{ health: string }> = ({ health }) => {
  const colors: Record<string, string> = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${colors[health] || 'bg-gray-400'}`} />;
};

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className={`h-2 rounded-full ${progress >= 80 ? 'bg-green-500' : progress >= 50 ? 'bg-blue-500' : progress >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    analyticsApi
      .getDashboard()
      .then((res) => setData(res.data as DashboardData))
      .catch((err) => {
        console.error('Ошибка загрузки дашборда:', err);
        setError(err.message || 'Не удалось загрузить данные');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Загрузка дашборда...</div>;
  if (error) return <div className="text-sm text-red-500">Ошибка: {error}</div>;
  if (!data) return <div className="text-sm text-gray-500">Нет данных для отображения</div>;

  const { kpis, scorecard, team } = data;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Аналитика и управление проектами</h2>

      {/* KPI Portlets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Активные проекты" value={kpis.active_projects} color="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 text-blue-700" />
        <KpiCard title="Всего документов" value={kpis.total_documents} color="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 text-gray-700" />
        <KpiCard title="Утверждено" value={kpis.approved_documents} subtitle={`${kpis.total_documents ? Math.round(kpis.approved_documents / kpis.total_documents * 100) : 0}%`} color="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-700" />
        <KpiCard title="Открытые замечания" value={kpis.open_remarks} color="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 text-amber-700" />
        <KpiCard title="Критичные" value={kpis.critical_remarks} color="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 text-red-700" />
        <KpiCard title="Эффективность" value={`${kpis.avg_efficiency}%`} color="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 text-purple-700" />
      </div>

      {/* Project Scorecard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Портфель проектов (Scorecard)</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-400 dark:text-gray-500 text-xs">
                <th className="pb-2 pr-3 pt-2 pl-4 font-medium">Проект</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Прогресс</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Здоровье</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Документы</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Замечания</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Дедлайн</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {scorecard.map((project: ScorecardProject) => (
                <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-2 pr-3 pl-4">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{project.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{project.code}</div>
                  </td>
                  <td className="py-2 pr-3 w-40">
                    <ProgressBar progress={project.progress} />
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{project.progress}%</div>
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <HealthDot health={project.health} />
                      <span className="text-xs">
                        {project.health === 'green' ? 'В норме' : project.health === 'yellow' ? 'Риск' : 'Критично'}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">
                    {project.documents_approved} / {project.documents_total}
                  </td>
                  <td className="py-2 pr-3 text-xs">
                    <span className={`${project.open_remarks > 3 ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                      {project.open_remarks} открытых
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="py-2 pr-3">
                    <a href={`/projects`} className="text-xs text-blue-600 hover:underline">Открыть</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Производительность команды</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-400 dark:text-gray-500 text-xs">
                <th className="pb-2 pr-3 pt-2 pl-4 font-medium">Сотрудник</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Роль</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Документы</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Замечания</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Сессий</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Эффективность</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Активное время</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member: TeamMember) => (
                <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-2 pr-3 pl-4 font-medium text-gray-800 dark:text-gray-200">{member.full_name}</td>
                  <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400">{member.role}</td>
                  <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">{member.documents_count}</td>
                  <td className="py-2 pr-3 text-xs">
                    <span className={member.open_remarks > 5 ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                      {member.open_remarks}
                    </span>
                  </td>
                  <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">{member.sessions}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${member.efficiency >= 90 ? 'bg-green-500' : member.efficiency >= 70 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(100, member.efficiency)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{member.efficiency}%</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">{member.active_time_hours}ч</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
