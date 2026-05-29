import React, { useMemo } from 'react';
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
import { ArchiveStatistics as ArchiveStatisticsType, ArchiveEntry, TimelineEvent } from '../../types/archive';

interface Props {
  statistics: ArchiveStatisticsType | null;
  entries?: ArchiveEntry[];
  timeline?: TimelineEvent[];
}

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
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

const TYPE_LABELS: Record<string, string> = {
  material: 'Материалы',
  construction: 'Конструкции',
  document: 'Документы',
  remark: 'Замечания',
  workflow: 'Workflow',
  revision: 'Ревизии',
  comment: 'Комментарии',
  file_upload: 'Файлы',
  project_event: 'События',
  meeting: 'Встречи',
  decision: 'Решения',
  photo: 'Фото',
  calculation: 'Расчёты',
  certificate: 'Сертификаты',
  handover: 'Приёмки',
  external_communication: 'Внешние комм.',
};

export const ArchiveStatistics: React.FC<Props> = ({ statistics, entries = [], timeline = [] }) => {
  // BarChart: записи по типам (materials, constructions, documents)
  const typeBarData = useMemo(() => {
    const targetTypes = ['material', 'construction', 'document'];
    if (statistics?.by_type && Object.keys(statistics.by_type).length > 0) {
      return targetTypes
        .map((type) => ({
          name: TYPE_LABELS[type] || type,
          value: statistics.by_type[type] || 0,
        }))
        .filter((d) => d.value > 0);
    }
    // fallback from entries
    const counts: Record<string, number> = {};
    entries.forEach((e) => {
      const label = TYPE_LABELS[e.entry_type] || e.entry_type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [statistics, entries]);

  // PieChart: распределение по годам
  const yearPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    const source = entries.length > 0 ? entries : timeline;
    source.forEach((e: any) => {
      const dateStr = e.occurred_at || e.created_at;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear().toString();
        counts[year] = (counts[year] || 0) + 1;
      }
    });
    // fallback mock
    if (Object.keys(counts).length === 0) {
      counts['2024'] = 12;
      counts['2025'] = 28;
      counts['2026'] = 15;
    }
    return Object.entries(counts).map(([name, value]) => ({ name: `${name} г.`, value }));
  }, [entries, timeline]);

  // LineChart: динамика добавления записей по месяцам
  const monthlyLineData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const counts: Record<string, number> = {};
    months.forEach((m) => (counts[m] = 0));

    const source = entries.length > 0 ? entries : timeline;
    source.forEach((e: any) => {
      const dateStr = e.occurred_at || e.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        const m = months[d.getMonth()];
        counts[m] = (counts[m] || 0) + 1;
      }
    });

    // fallback mock
    if (Object.values(counts).every((v) => v === 0)) {
      counts['Янв'] = 2;
      counts['Фев'] = 4;
      counts['Мар'] = 3;
      counts['Апр'] = 5;
      counts['Май'] = 7;
      counts['Июн'] = 4;
    }

    return months.map((m) => ({ month: m, count: counts[m] || 0 }));
  }, [entries, timeline]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] rounded-lg p-4">
          <div className="text-xs text-[#94a3b8] mb-1">Всего записей</div>
          <div className="text-xl font-bold text-[#e2e8f0]">{statistics?.total_entries ?? entries.length ?? 0}</div>
        </div>
        <div className="bg-[#1e293b] rounded-lg p-4">
          <div className="text-xs text-[#94a3b8] mb-1">Материалов</div>
          <div className="text-xl font-bold text-[#e2e8f0]">{statistics?.materials_count ?? 0}</div>
        </div>
        <div className="bg-[#1e293b] rounded-lg p-4">
          <div className="text-xs text-[#94a3b8] mb-1">Конструкций</div>
          <div className="text-xl font-bold text-[#e2e8f0]">{statistics?.constructions_count ?? 0}</div>
        </div>
        <div className="bg-[#1e293b] rounded-lg p-4">
          <div className="text-xs text-[#94a3b8] mb-1">Событий в таймлайне</div>
          <div className="text-xl font-bold text-[#e2e8f0]">{timeline.length}</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BarChart: по типам */}
        <div className="bg-[#1e293b] rounded-lg p-4">
          <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">По типам записей</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBarData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Количество']} />
                <Bar dataKey="value" name="Количество" radius={[4, 4, 0, 0]}>
                  {typeBarData.map((_entry, index) => (
                    <Cell key={`bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PieChart: по годам */}
        <div className="bg-[#1e293b] rounded-lg p-4">
          <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">Распределение по годам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={yearPieData}
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
                  {yearPieData.map((_entry, index) => (
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
          <h3 className="text-sm font-bold text-[#e2e8f0] mb-4">Динамика добавления</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Записи']} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                <Line type="monotone" dataKey="count" name="Записи" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: '#1e293b' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
