import React from 'react';
import { RemarkStatistics } from '@/types/remarks';

interface RemarksStatisticsProps {
  statistics: RemarkStatistics | null;
}

export const RemarksStatistics: React.FC<RemarksStatisticsProps> = ({
  statistics,
}) => {
  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#64748b]">Загрузка статистики...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Всего замечаний',
      value: statistics.total,
      color: 'bg-blue-500',
      icon: '📋',
    },
    {
      title: 'Просрочено',
      value: statistics.overdue_count,
      color: 'bg-red-500',
      icon: '⚠️',
    },
    {
      title: 'Мои открытые',
      value: statistics.my_open_count,
      color: 'bg-green-500',
      icon: '✅',
    },
    {
      title: 'Ср. время решения',
      value: statistics.avg_resolution_time_hours
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

      {/* By status */}
      <div className="bg-[#1e293b] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По статусам</h3>
        <div className="space-y-3">
          {Object.entries(statistics.by_status).map(([status, count]) => (
            <div key={status} className="flex items-center gap-3">
              <span className="text-xs text-[#94a3b8] w-24 capitalize">
                {status.replace('_', ' ')}
              </span>
              <div className="flex-1 bg-[#0f172a] rounded-full h-2">
                <div
                  className="bg-[#3b82f6] h-2 rounded-full"
                  style={{ width: `${(count / statistics.total) * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-[#e2e8f0] w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By priority */}
      <div className="bg-[#1e293b] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По приоритетам</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(statistics.by_priority).map(([priority, count]) => {
            const colors: Record<string, string> = {
              critical: 'bg-red-500',
              high: 'bg-orange-500',
              medium: 'bg-yellow-500',
              low: 'bg-green-500',
            };
            return (
              <div key={priority} className="text-center">
                <div className={`inline-block px-3 py-2 ${colors[priority]} text-white rounded-lg mb-2`}>
                  <div className="text-lg font-bold">{count}</div>
                </div>
                <div className="text-xs text-[#94a3b8] capitalize">{priority.replace('_', ' ')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By category */}
      <div className="bg-[#1e293b] rounded-lg p-4">
        <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По категориям</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statistics.by_category).map(([category, count]) => (
            <div
              key={category}
              className="px-3 py-2 bg-[#0f172a] rounded-lg border border-[#334155]"
            >
              <div className="text-sm text-[#e2e8f0] font-medium">{count}</div>
              <div className="text-xs text-[#94a3b8] capitalize">{category.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
