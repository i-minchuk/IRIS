import React, { useEffect, useState } from 'react';
import { resourcesApi, type WorkloadData, type TeamMemberWorkload, type WeeklyLoad } from '@/features/resources/api/resources';

const StatusDot: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    free: 'bg-green-500',
    busy: 'bg-yellow-500',
    overload: 'bg-red-500',
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />;
};

const UtilBar: React.FC<{ utilization: number; status: string }> = ({ utilization }) => (
  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
    <div
      className={`h-2 rounded-full ${
        utilization < 50 ? 'bg-green-500' : utilization < 85 ? 'bg-yellow-500' : 'bg-red-500'
      }`}
      style={{ width: `${Math.min(100, utilization)}%` }}
    />
  </div>
);

export const ResourcesPage: React.FC = () => {
  const [data, setData] = useState<WorkloadData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    resourcesApi
      .getWorkload()
      .then((res: { data: WorkloadData }) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500 dark:text-gray-400">Загрузка…</div>;
  if (!data) return <div className="text-sm text-red-500">Ошибка загрузки данных</div>;

  const { weeks, team, active_projects, total_team_size } = data;

  // Calculate aggregate weekly load
  const aggregateLoad = weeks.map((_, idx) => {
    const totalHours = team.reduce((sum, m) => sum + (m.weekly_load[idx]?.hours || 0), 0);
    const totalCapacity = team.reduce((sum, m) => sum + (m.weekly_load[idx]?.capacity || 40), 0);
    return {
      week: weeks[idx],
      totalHours: Math.round(totalHours * 10) / 10,
      utilization: totalCapacity > 0 ? Math.round((totalHours / totalCapacity) * 1000) / 10 : 0,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Ресурсы и загрузка команды</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Команда: <span className="font-medium">{total_team_size}</span> чел. | Активных проектов: <span className="font-medium">{active_projects.length}</span>
        </span>
      </div>

      {/* Aggregate weekly chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Общая загрузка команды по неделям</h3>
        <div className="space-y-2">
          {aggregateLoad.map((w) => (
            <div key={w.week} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-24">{w.week}</span>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full text-[10px] text-white flex items-center px-2 ${
                    w.utilization < 50 ? 'bg-green-500' : w.utilization < 85 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, w.utilization)}%` }}
                >
                  {w.utilization > 15 && `${w.utilization}%`}
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 w-16">{w.totalHours}ч</span>
            </div>
          ))}
        </div>
      </div>

      {/* Team workload table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Загрузка по сотрудникам</h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-400 dark:text-gray-500 text-xs">
                <th className="pb-2 pr-3 pt-2 pl-4 font-medium">Сотрудник</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Роль</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Проекты</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Документы</th>
                <th className="pb-2 pr-3 pt-2 font-medium">Эффективность</th>
                {weeks.map((w) => (
                  <th key={w} className="pb-2 pr-3 pt-2 font-medium whitespace-nowrap">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.map((member: TeamMemberWorkload) => (
                <tr key={member.id} className="border-b border-gray-50 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-2 pr-3 pl-4">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{member.full_name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{member.month_active_hours}ч за 30дн</div>
                  </td>
                  <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400">{member.role}</td>
                  <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">{member.active_projects}</td>
                  <td className="py-2 pr-3 text-xs text-gray-600 dark:text-gray-400">{member.documents_total}</td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${member.efficiency >= 90 ? 'bg-green-500' : member.efficiency >= 70 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                          style={{ width: `${Math.min(100, member.efficiency)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">{member.efficiency}%</span>
                    </div>
                  </td>
                  {member.weekly_load.map((wl: WeeklyLoad, i: number) => (
                    <td key={i} className="py-2 pr-3">
                      <div className="flex items-center gap-1.5">
                        <StatusDot status={wl.status} />
                        <UtilBar utilization={wl.utilization} status={wl.status} />
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{wl.hours} / {wl.capacity}ч</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active projects */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Активные проекты и занятость</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {active_projects.map((p) => (
            <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <div className="font-medium text-gray-800 dark:text-gray-200">{p.name}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500">{p.code}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">👥 {p.team_size} человек</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
