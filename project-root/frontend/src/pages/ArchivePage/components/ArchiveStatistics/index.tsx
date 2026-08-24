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

const PIE_COLORS = ['var(--iris-accent-blue)', 'var(--iris-accent-orange)', 'var(--iris-accent-green)', 'var(--iris-accent-red)', 'var(--iris-accent-purple)', 'var(--iris-accent-pink)', 'var(--iris-accent-sky)', 'var(--iris-accent-teal)'];
const LINE_COLORS = ['var(--iris-accent-blue)', 'var(--iris-accent-green)'];

function tooltipStyle() {
  return {
    backgroundColor: 'var(--iris-bg-surface-elevated)',
    border: '1px solid var(--iris-border-default)',
    borderRadius: '8px',
    color: 'var(--iris-text-primary)',
    fontSize: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
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

    return months.map((m) => ({ month: m, count: counts[m] || 0 }));
  }, [entries, timeline]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--iris-text-secondary)' }}>Всего записей</div>
          <div className="text-xl font-bold" style={{ color: 'var(--iris-text-primary)' }}>{statistics?.total_entries ?? entries.length ?? 0}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--iris-text-secondary)' }}>Материалов</div>
          <div className="text-xl font-bold" style={{ color: 'var(--iris-text-primary)' }}>{statistics?.materials_count ?? 0}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--iris-text-secondary)' }}>Конструкций</div>
          <div className="text-xl font-bold" style={{ color: 'var(--iris-text-primary)' }}>{statistics?.constructions_count ?? 0}</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <div className="text-xs mb-1" style={{ color: 'var(--iris-text-secondary)' }}>Событий в таймлайне</div>
          <div className="text-xl font-bold" style={{ color: 'var(--iris-text-primary)' }}>{timeline.length}</div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BarChart: по типам */}
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--iris-text-primary)' }}>По типам записей</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBarData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--iris-border-default)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--iris-text-secondary)', fontSize: 10 }} axisLine={{ stroke: 'var(--iris-border-default)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--iris-text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--iris-border-default)' }} tickLine={false} />
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
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--iris-text-primary)' }}>Распределение по годам</h3>
          <div className="h-48">
            {yearPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs" style={{ color: 'var(--iris-text-secondary)' }}>
                Нет данных
              </div>
            ) : (
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
                  labelLine={{ stroke: 'var(--iris-text-secondary)', strokeOpacity: 0.4 }}
                >
                  {yearPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.85} stroke="var(--iris-bg-surface)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, _name, props: any) => [`${value}`, props?.payload?.name ?? '']} />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LineChart: динамика по месяцам */}
        <div className="rounded-lg p-4" style={{ background: 'var(--iris-bg-surface)', border: '1px solid var(--iris-border-default)' }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--iris-text-primary)' }}>Динамика добавления</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--iris-border-default)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--iris-text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--iris-border-default)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--iris-text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--iris-border-default)' }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Записи']} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--iris-text-secondary)' }} />
                <Line type="monotone" dataKey="count" name="Записи" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: 'var(--iris-bg-surface)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
