import React, { useEffect, useState } from 'react';
import { getProjects } from '@/api/projects';
import { getRemarks } from '@/api/remarks';
import type { Project } from '@/api/projects';
import type { PaginatedResponse, RemarkListItem } from '@/types/remarks';
// TODO: Подключить time_sessions после миграции на PostgreSQL
// Сейчас дашборд использует только projects + remarks для KPI

interface DashboardData {
  activeProjects: number;
  totalProjects: number;
  inProgressRemarks: number;
  totalRemarks: number;
  recentProjects: Project[];
  recentRemarks: RemarkListItem[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [projects, remarksResponse]: [Project[], PaginatedResponse<RemarkListItem>] = await Promise.all([
        getProjects(),
        getRemarks({ page: 1, page_size: 10 }),
      ]);

      const activeProjects = projects.filter(p => p.status === 'active').length;
      const inProgressRemarks = remarksResponse.items.filter(r => r.status === 'in_progress').length;

      setData({
        activeProjects,
        totalProjects: projects.length,
        inProgressRemarks,
        totalRemarks: remarksResponse.total,
        recentProjects: projects.slice(0, 3),
        recentRemarks: remarksResponse.items.slice(0, 3),
      });
      setError(null);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Не удалось загрузить данные дашборда');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#64748b]">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3b82f6]"></div>
          <span className="text-sm">Загрузка дашборда…</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 max-w-md">
          <div className="font-medium text-red-400 mb-2">Ошибка загрузки</div>
          <div className="text-xs text-[#64748b]">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Дашборд</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Обзор проектов и замечаний
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-3 py-1.5 bg-[#334155] rounded text-xs text-[#e2e8f0] hover:bg-[#475569] transition-colors"
        >
          Обновить
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Активные проекты"
          value={data?.activeProjects || 0}
          total={data?.totalProjects}
          color="bg-blue-500"
        />
        <KpiCard
          title="Замечания в работе"
          value={data?.inProgressRemarks || 0}
          total={data?.totalRemarks}
          color="bg-yellow-500"
        />
        <KpiCard
          title="Всего проектов"
          value={data?.totalProjects || 0}
          color="bg-green-500"
        />
        <KpiCard
          title="Всего замечаний"
          value={data?.totalRemarks || 0}
          color="bg-purple-500"
        />
      </div>

      {/* Recent Projects */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <h2 className="text-sm font-semibold text-[#e2e8f0] mb-3">Последние проекты</h2>
        {data?.recentProjects.length ? (
          <div className="space-y-2">
            {data.recentProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between py-2 border-b border-[#334155] last:border-0"
              >
                <div>
                  <div className="font-medium text-[#e2e8f0]">{project.name}</div>
                  <div className="text-xs text-[#64748b]">{project.code}</div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-xs ${
                    project.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {project.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#64748b] py-4">Нет проектов</div>
        )}
      </div>

      {/* Recent Remarks */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
        <h2 className="text-sm font-semibold text-[#e2e8f0] mb-3">Последние замечания</h2>
        {data?.recentRemarks.length ? (
          <div className="space-y-2">
            {data.recentRemarks.map((remark) => (
              <div
                key={remark.id}
                className="flex items-center justify-between py-2 border-b border-[#334155] last:border-0"
              >
                <div>
                  <div className="font-medium text-[#e2e8f0]">{remark.title}</div>
                  <div className="text-xs text-[#64748b]">
                    {remark.priority} • {remark.category}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${getStatusColor(remark.status)}`}
                  >
                    {remark.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#64748b] py-4">Нет замечаний</div>
        )}
      </div>
    </div>
  );
}

// Helper components
const KpiCard: React.FC<{
  title: string;
  value: number;
  total?: number;
  color: string;
}> = ({ title, value, total, color }) => (
  <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
    <div className="flex items-center gap-3">
      <div className={`w-1 h-10 rounded ${color}`}></div>
      <div>
        <div className="text-xs text-[#64748b]">{title}</div>
        <div className="text-2xl font-bold text-[#e2e8f0] mt-1">
          {value}
          {total && total > 0 && (
            <span className="text-sm font-normal text-[#64748b] ml-1">/ {total}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    in_progress: 'bg-yellow-500/20 text-yellow-400',
    resolved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
    deferred: 'bg-gray-500/20 text-gray-400',
    closed: 'bg-purple-500/20 text-purple-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
};
