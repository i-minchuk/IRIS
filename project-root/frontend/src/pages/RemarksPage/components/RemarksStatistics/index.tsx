import React, { useMemo } from 'react';
import { RemarkStatistics, RemarkListItem } from '@/types/remarks';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface RemarksStatisticsProps {
  statistics: RemarkStatistics | null;
  remarks?: RemarkListItem[];
}

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899'];
const LINE_COLORS = ['#3B82F6', '#10B981'];

function tooltipStyle() {
  return {
    backgroundColor: 'rgba(11,14,20,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.50)',
  };
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Новые',
  in_progress: 'В работе',
  resolved: 'Устранено',
  closed: 'Закрыто',
  rejected: 'Отклонено',
  deferred: 'Отложено',
};

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Критический',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

export const RemarksStatistics: React.FC<RemarksStatisticsProps> = ({
  statistics,
  remarks = [],
}) => {
  // BarChart: по статусам
  const statusBarData = useMemo(() => {
    if (statistics?.by_status && Object.keys(statistics.by_status).length > 0) {
      return Object.entries(statistics.by_status).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
      }));
    }
    // fallback from remarks list
    const counts: Record<string, number> = {};
    remarks.forEach(r => {
      const label = STATUS_LABELS[r.status] || r.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [statistics, remarks]);

  // PieChart: по приоритетам
  const priorityPieData = useMemo(() => {
    if (statistics?.by_priority && Object.keys(statistics.by_priority).length > 0) {
      return Object.entries(statistics.by_priority).map(([priority, count]) => ({
        name: PRIORITY_LABELS[priority] || priority,
        value: count,
      }));
    }
    const counts: Record<string, number> = {};
    remarks.forEach(r => {
      const label = PRIORITY_LABELS[r.priority] || r.priority;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [statistics, remarks]);

  // LineChart: динамика создания/закрытия по месяцам
  const monthlyLineData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const created: Record<string, number> = {};
    const closed: Record<string, number> = {};
    months.forEach(m => { created[m] = 0; closed[m] = 0; });

    remarks.forEach(r => {
      if (r.created_at) {
        const d = new Date(r.created_at);
        const m = months[d.getMonth()];
        created[m] = (created[m] || 0) + 1;
      }
      if ('resolved_at' in r && (r as any).resolved_at) {
        const d = new Date((r as any).resolved_at);
        const m = months[d.getMonth()];
        closed[m] = (closed[m] || 0) + 1;
      }
    });

    return months.map(m => ({
      month: m,
      created: created[m] || 0,
      closed: closed[m] || 0,
    }));
  }, [remarks]);

  if (!statistics && remarks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#64748b]">Загрузка статистики...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего замечаний',
      value: statistics?.total ?? remarks.length,
      color: 'bg-blue-500',
      icon: '📋',
    },
    {
      title: 'Просрочено',
      value: statistics?.overdue_count ?? 0,
      color: 'bg-red-500',
      icon: '⚠️',
    },
    {
      title: 'Мои открытые',
      value: statistics?.my_open_count ?? 0,
      color: 'bg-green-500',
      icon: '✅',
    },
    {
      title: 'Ср. время решения',
      value: statistics?.avg_resolution_time_hours
        ? `${Math.round(statistics.avg_resolution_time_hours)}ч`
        : '—',
      color: 'bg-purple-500',
      icon: '⏱️',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className="bg-[#1e293b] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className={`px-2 py-1 ${card.color} text-white text-xs font-bold rounded`}>
                {card.value}
              </span>
            </div>
            <div className="text-xs text-[#94a3b8]">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BarChart: по статусам */}
        <div className="bg-[#1e293b] rounded-lg p-4">
          <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По статусам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBarData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Количество']} />
                <Bar dataKey="value" name="Количество" radius={[4, 4, 0, 0]}>
                  {statusBarData.map((_entry, index) => (
                    <Cell key={`bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart: по приоритетам */}
        <div className="bg-[#1e293b] rounded-lg p-4">
          <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По приоритетам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#94a3b8', strokeOpacity: 0.4 }}
                >
                  {priorityPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.85} stroke="#1e293b" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, _name, props: any) => [`${value}`, props?.payload?.name ?? '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LineChart: динамика по месяцам */}
        <div className="bg-[#1e293b] rounded-lg p-4">
          <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">Динамика создания / закрытия</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="created" name="Создано" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#1e293b' }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="closed" name="Закрыто" stroke={LINE_COLORS[1]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#1e293b' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* By category */}
      <div className="bg-[#1e293b] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По категориям</h3>
        <div className="flex flex-wrap gap-2">
          {statistics && Object.entries(statistics.by_category).map(([category, count]) => (
            <div
              key={category}
              className="px-3 py-2 bg-[#0f172a] rounded-lg border border-[#334155]"
            >
              <div className="text-sm text-[#e2e8f0] font-medium">{count}</div>
              <div className="text-xs text-[#94a3b8] capitalize">{category.replace('_', ' ')}</div>
            </div>
          ))}
          {(!statistics || Object.keys(statistics.by_category).length === 0) && (
            <div className="text-xs text-[#94a3b8]">Нет данных по категориям</div>
          )}
        </div>
      </div>
    </div>
  );
};
