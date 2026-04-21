import { useEffect, useState } from 'react';
import { getWorkload } from '../api/workload';
import type { WorkloadResponse, } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, UserCheck, UserX } from 'lucide-react';

const MOCK_WORKLOAD: WorkloadResponse = {
  period: { from: '2026-03-25', to: '2026-04-24', work_days: 22 },
  engineers: [
    { engineer: 'Иванов А.А.', total_tasks: 12, active_tasks: 5, completed_tasks: 7, planned_hours: 120, actual_hours: 85, remaining_hours: 35, capacity_hours: 176, free_hours: 141, utilization_pct: 19.9, overdue_tasks: 0, status: 'available' },
    { engineer: 'Петров Б.В.', total_tasks: 18, active_tasks: 10, completed_tasks: 8, planned_hours: 200, actual_hours: 95, remaining_hours: 105, capacity_hours: 176, free_hours: 71, utilization_pct: 59.7, overdue_tasks: 1, status: 'busy' },
    { engineer: 'Сидоров В.Г.', total_tasks: 22, active_tasks: 15, completed_tasks: 7, planned_hours: 280, actual_hours: 110, remaining_hours: 170, capacity_hours: 176, free_hours: 6, utilization_pct: 96.6, overdue_tasks: 3, status: 'overloaded' },
    { engineer: 'Козлов Д.И.', total_tasks: 8, active_tasks: 3, completed_tasks: 5, planned_hours: 80, actual_hours: 60, remaining_hours: 20, capacity_hours: 176, free_hours: 156, utilization_pct: 11.4, overdue_tasks: 0, status: 'available' },
    { engineer: 'Новиков Е.К.', total_tasks: 15, active_tasks: 9, completed_tasks: 6, planned_hours: 160, actual_hours: 70, remaining_hours: 90, capacity_hours: 176, free_hours: 86, utilization_pct: 51.1, overdue_tasks: 2, status: 'busy' },
  ],
  summary: { total_engineers: 5, overloaded: 1, busy: 2, available: 2 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Доступен', color: 'text-green-700', bg: 'bg-green-100' },
  busy: { label: 'Загружен', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  overloaded: { label: 'Перегружен', color: 'text-red-700', bg: 'bg-red-100' },
};

export default function Workload() {
  const [data, setData] = useState<WorkloadResponse>(MOCK_WORKLOAD);

  useEffect(() => {
    getWorkload().then(setData).catch(() => {});
  }, []);

  const chartData = data.engineers.map(e => ({
    name: e.engineer.split(' ')[0],
    'Оставшиеся часы': e.remaining_hours,
    'Свободные часы': e.free_hours,
    utilization: e.utilization_pct,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Загруженность команды</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-primary-600" />
            <div>
              <div className="text-sm text-gray-500">Всего инженеров</div>
              <div className="text-2xl font-bold">{data.summary.total_engineers}</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <UserCheck size={24} className="text-green-600" />
            <div>
              <div className="text-sm text-green-700">Доступны</div>
              <div className="text-2xl font-bold text-green-700">{data.summary.available}</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-yellow-600" />
            <div>
              <div className="text-sm text-yellow-700">Загружены</div>
              <div className="text-2xl font-bold text-yellow-700">{data.summary.busy}</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <UserX size={24} className="text-red-600" />
            <div>
              <div className="text-sm text-red-700">Перегружены</div>
              <div className="text-2xl font-bold text-red-700">{data.summary.overloaded}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">Нагрузка по инженерам (часы)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Оставшиеся часы" fill="var(--error)" stackId="a" />
            <Bar dataKey="Свободные часы" fill="var(--success)" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table */}
      <div className="bg-bg-card rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-page border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase">Инженер</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase">Статус</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase">Активные задачи</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase">Просрочены</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase">Загрузка</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-text-muted uppercase">Свободные часы</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {data.engineers.map(e => {
              const cfg = STATUS_CONFIG[e.status];
              return (
                <tr key={e.engineer} className="hover:bg-bg-page">
                  <td className="px-6 py-4 font-medium">{e.engineer}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{e.active_tasks}</td>
                  <td className="px-6 py-4 text-sm">{e.overdue_tasks > 0 ? <span className="text-error font-medium">{e.overdue_tasks}</span> : '0'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-border rounded-full h-2">
                        <div className={`h-2 rounded-full ${e.utilization_pct > 90 ? 'bg-error' : e.utilization_pct > 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(e.utilization_pct, 100)}%` }} />
                      </div>
                      <span className="text-sm text-text-muted">{e.utilization_pct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-success-700">{e.free_hours} ч</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
