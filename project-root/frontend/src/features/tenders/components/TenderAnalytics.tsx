import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { TenderSummary, Tender } from '../types/tender';

interface Props {
  summary: TenderSummary | null;
  tenders?: Tender[];
}

function formatMoney(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} млн`;
  return `${(v / 1000).toFixed(0)} тыс`;
}

const STAGE_LABELS: Record<string, string> = {
  new: 'Новый',
  qualification: 'Квалификация',
  preparation: 'Подготовка',
  approval: 'Согласование',
  submitted: 'Подан',
  auction: 'Аукцион',
  waiting: 'Ожидание',
  won: 'Выигран',
  lost: 'Проигран',
  contract: 'Договор',
};

const STAGE_COLORS: Record<string, string> = {
  new: 'var(--text-muted)',
  qualification: 'var(--iris-accent-amber)',
  preparation: 'var(--iris-accent-blue)',
  approval: 'var(--iris-accent-purple)',
  submitted: 'var(--iris-accent-cyan)',
  auction: 'var(--iris-accent-amber)',
  waiting: 'var(--iris-accent-blue)',
  won: '#2E8B57',
  lost: 'var(--iris-accent-coral)',
  contract: '#1E6B3A',
};

const PIE_COLORS = [
  'var(--iris-accent-cyan)',
  'var(--iris-accent-blue)',
  'var(--iris-accent-amber)',
  'var(--iris-accent-purple)',
  'var(--iris-accent-coral)',
  'var(--iris-accent-magenta)',
];

function useCssVar(name: string): string {
  if (typeof window === 'undefined') return '#888';
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || '#888';
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; dataKey?: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        borderColor: 'var(--iris-border-subtle)',
        background: 'var(--iris-bg-tooltip)',
        color: 'var(--iris-text-inverse)',
      }}
    >
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: entry.color || 'currentColor' }}
          />
          <span>{entry.name}:</span>
          <span className="font-mono font-medium">
            {typeof entry.value === 'number' ? formatMoney(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { count: number } }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0];
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        borderColor: 'var(--iris-border-subtle)',
        background: 'var(--iris-bg-tooltip)',
        color: 'var(--iris-text-inverse)',
      }}
    >
      <div className="font-semibold">{p.name}</div>
      <div className="mt-1">
        Сумма: <span className="font-mono font-medium">{formatMoney(p.value)}</span>
      </div>
      <div>
        Кол-во: <span className="font-mono font-medium">{p.payload.count}</span>
      </div>
    </div>
  );
}

export function TenderAnalytics({ summary, tenders = [] }: Props) {
  const textMuted = useCssVar('--text-muted');
  const textSecondary = useCssVar('--text-secondary');
  const gridColor = useCssVar('--iris-bg-subtle');

  if (!summary) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-48 animate-pulse rounded" style={{ background: 'var(--iris-bg-skeleton)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-40 animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
          <div className="h-40 animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
        </div>
      </div>
    );
  }

  // BarChart data: sums by stage
  const barData = Object.entries(summary.pipeline)
    .filter(([, v]) => v.count > 0)
    .map(([stage, data]) => ({
      stage: STAGE_LABELS[stage] || stage,
      sum: data.sum_nmc,
      count: data.count,
      color: STAGE_COLORS[stage] || textMuted,
    }));

  // LineChart data: derived from tenders by created_at month
  const lineData = (() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const stats = new Map<number, { won: number; total: number }>();
    tenders.forEach((t) => {
      const d = t.created_at ? new Date(t.created_at) : null;
      if (!d) return;
      const m = d.getMonth();
      const s = stats.get(m) || { won: 0, total: 0 };
      s.total += 1;
      if (t.stage === 'won' || t.stage === 'contract') s.won += 1;
      stats.set(m, s);
    });
    const sortedMonths = Array.from(stats.keys()).sort((a, b) => a - b);
    return sortedMonths.map((m) => {
      const s = stats.get(m)!;
      return { month: months[m], winRate: parseFloat(((s.won / s.total) * 100).toFixed(1)) };
    });
  })();
  const hasLineData = lineData.length > 0;

  // PieChart data: distribution by project_type with "Другие" for rare types
  const pieData = (() => {
    const map = new Map<string, { sum: number; count: number }>();
    tenders.forEach((t) => {
      const type = t.project_type || 'Не указан';
      const cur = map.get(type) || { sum: 0, count: 0 };
      cur.sum += t.nmc || 0;
      cur.count += 1;
      map.set(type, cur);
    });
    const entries = Array.from(map.entries());
    if (entries.length <= 5) {
      return entries.map(([name, data]) => ({ name, value: data.sum, count: data.count }));
    }
    // Keep top 4, group the rest as "Другие"
    const sorted = entries.sort((a, b) => b[1].sum - a[1].sum);
    const top = sorted.slice(0, 4);
    const other = sorted.slice(4);
    const otherSum = other.reduce((acc, [, d]) => acc + d.sum, 0);
    const otherCount = other.reduce((acc, [, d]) => acc + d.count, 0);
    return [
      ...top.map(([name, data]) => ({ name, value: data.sum, count: data.count })),
      { name: 'Другие', value: otherSum, count: otherCount },
    ];
  })();
  const hasPieData = pieData.length > 0;

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Аналитика
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* BarChart — sums by stage */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Воронка по суммам
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="stage"
                  tick={{ fill: textSecondary, fontSize: 10 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  axisLine={{ stroke: gridColor }}
                  tickLine={{ stroke: gridColor }}
                />
                <YAxis
                  tick={{ fill: textSecondary, fontSize: 10 }}
                  tickFormatter={(v: number) => formatMoney(v)}
                  axisLine={{ stroke: gridColor }}
                  tickLine={{ stroke: gridColor }}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 10, color: textSecondary }}
                  formatter={() => 'Сумма НМЦ'}
                />
                <Bar dataKey="sum" name="Сумма НМЦ" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LineChart — win rate dynamics */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Динамика win rate
          </h4>
          <div className="h-64">
            {hasLineData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: textSecondary, fontSize: 10 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={{ stroke: gridColor }}
                  />
                  <YAxis
                    tick={{ fill: textSecondary, fontSize: 10 }}
                    tickFormatter={(v: number) => `${v}%`}
                    axisLine={{ stroke: gridColor }}
                    tickLine={{ stroke: gridColor }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      return (
                        <div
                          className="rounded-lg border px-3 py-2 text-xs shadow-lg"
                          style={{
                            borderColor: 'var(--iris-border-subtle)',
                            background: 'var(--iris-bg-tooltip)',
                            color: 'var(--iris-text-inverse)',
                          }}
                        >
                          <div className="font-semibold">{label}</div>
                          <div className="mt-1">
                            Win rate:{' '}
                            <span className="font-mono font-medium">{payload[0].value}%</span>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, color: textSecondary }} />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    name="Win rate, %"
                    stroke="var(--iris-accent-cyan)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--iris-accent-cyan)', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg" style={{ background: 'var(--iris-bg-subtle)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Нет данных</span>
              </div>
            )}
          </div>
        </div>

        {/* PieChart — distribution by type */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Распределение по типам заказов
          </h4>
          <div className="h-64">
            {hasPieData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    innerRadius="45%"
                    paddingAngle={3}
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: textSecondary }}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 10, color: textSecondary }}
                    formatter={(value: string, entry: { payload?: { count?: number } }) =>
                      `${value} (${entry?.payload?.count ?? 0})`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg" style={{ background: 'var(--iris-bg-subtle)' }}>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Нет данных</span>
              </div>
            )}
          </div>
        </div>

        {/* Key metrics (preserved) */}
        <div className="lg:col-span-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Ключевые метрики
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-subtle)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Процент выигрыша</div>
              <div className="text-2xl font-bold" style={{ color: summary.win_rate >= 30 ? 'var(--iris-accent-cyan)' : summary.win_rate >= 15 ? 'var(--iris-accent-amber)' : 'var(--iris-accent-coral)' }}>
                {summary.win_rate}%
              </div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-subtle)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Выиграно</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--iris-accent-cyan)' }}>
                {summary.won_count}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatMoney(summary.won_sum)} ₽</div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-subtle)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>В работе</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--iris-accent-blue)' }}>
                {summary.active_count}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{formatMoney(summary.active_sum)} ₽</div>
            </div>
            <div className="rounded-lg border p-3" style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-subtle)' }}>
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>На аукционе</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--iris-accent-amber)' }}>
                {summary.auction_now}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
