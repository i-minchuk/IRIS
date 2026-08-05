import { useState, useMemo } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import {
  Calendar, TrendingUp, TrendingDown,
  CheckCircle2, AlertCircle, Clock3, Factory,
} from 'lucide-react';
import { ProductionProject } from '../../types/production';
import { STAGE_CONFIG } from '../../constants/production';

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
type StatusFilter = 'all' | 'on_track' | 'at_risk' | 'delayed' | 'stopped';

/* ═══════════════════════════════════════════════════════════
   FILTER BAR
   ═══════════════════════════════════════════════════════════ */
function FilterBar({ options, active, onChange }: {
  options: { key: StatusFilter; label: string }[];
  active: StatusFilter;
  onChange: (k: StatusFilter) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {options.map((opt) => {
        const isActive = active === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="text-sm px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer"
            style={{
              background: isActive ? '#2563EB' : 'var(--card-bg)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              border: isActive ? '1px solid #2563EB' : '1px solid var(--border-color)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function ProductionProjectsList({
  projects,
  loading,
  onSelect,
}: {
  projects: ProductionProject[];
  loading: boolean;
  onSelect: (p: ProductionProject) => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'contrast';
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filtered = useMemo(() => projects.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    return true;
  }), [projects, filter]);

  const inProductionCount = projects.filter((p) => p.stage === 'production').length;
  const atRiskCount = projects.filter((p) => p.status === 'at_risk' || p.status === 'delayed').length;
  const onTrackCount = projects.filter((p) => p.status === 'on_track').length;
  const stoppedCount = projects.filter((p) => p.status === 'stopped').length;

  const kpi = [
    { label: 'В производстве', value: String(inProductionCount), sub: 'активные', color: '#06b6d4', icon: <Factory size={14} /> },
    { label: 'В риске / просрочены', value: String(atRiskCount), sub: 'требуют внимания', color: '#ef4444', icon: <AlertCircle size={14} /> },
    { label: 'По плану', value: String(onTrackCount), sub: 'без отклонений', color: '#22c55e', icon: <CheckCircle2 size={14} /> },
    { label: 'Остановлены', value: String(stoppedCount), sub: 'всего', color: '#6b7280', icon: <TrendingDown size={14} /> },
  ];

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Все статусы' },
    { key: 'on_track', label: 'По плану' },
    { key: 'at_risk', label: 'В риске' },
    { key: 'delayed', label: 'Просрочены' },
    { key: 'stopped', label: 'Остановлены' },
  ];

  const statusMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    on_track: { label: 'По плану', color: '#22c55e', icon: <TrendingUp size={12} /> },
    at_risk: { label: 'В риске', color: '#f59e0b', icon: <AlertCircle size={12} /> },
    delayed: { label: 'Просрочен', color: '#ef4444', icon: <Clock3 size={12} /> },
    stopped: { label: 'Остановлен', color: '#6b7280', icon: <TrendingDown size={12} /> },
  };

  return (
    <div className="space-y-4 px-3 md:px-6 py-4 md:pt-2 pb-6" style={{ background: 'var(--layout-bg)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div>
        <h2 className="text-base md:text-lg font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          Проекты, поступившие в производство
        </h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Реестр производственных проектов, статусы и сроки
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpi.map((item, i) => (
          <div key={i} className="p-3 rounded-lg flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: item.color + '15', color: item.color }}>
                {item.icon}
              </span>
            </div>
            <div className="text-xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterBar options={filterOptions} active={filter} onChange={setFilter} />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Код', 'Название', 'Заказчик', 'Стадия', 'Статус', 'Готовность', 'Срок', 'Сумма'].map((h) => (
                  <th key={h} className="text-xs font-semibold uppercase tracking-wider px-3 py-2.5" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка...</td></tr>
              ) : (
                <>
                  {filtered.map((p) => {
                    const stageCfg = STAGE_CONFIG[p.stage];
                    const status = statusMeta[p.status] || statusMeta.on_track;
                    return (
                      <tr
                        key={p.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--border-color)' }}
                        onClick={() => onSelect(p)}
                        onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-3 py-2.5 text-sm font-mono font-medium" style={{ color: 'var(--text-secondary)' }}>{p.code}</td>
                        <td className="px-3 py-2.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.customer}</td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: stageCfg?.color || 'var(--text-secondary)' }}>
                          {stageCfg?.label || p.stage}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: status.color + '15', color: status.color, border: `1px solid ${status.color}30` }}>
                            {status.icon} {status.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                              <div className="h-full rounded-full" style={{ width: `${p.progressPercent}%`, background: status.color }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{p.progressPercent}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(p.plannedFinish).toLocaleDateString('ru-RU')}</span>
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {p.contractSum > 0 ? `${p.contractSum.toFixed(1)} млн ₽` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>Ничего не найдено</td></tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
