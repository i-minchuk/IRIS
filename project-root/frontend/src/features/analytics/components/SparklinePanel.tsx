import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SparklinesData } from '../api/analytics';

interface SparklinePanelProps {
  data: SparklinesData | null;
  loading?: boolean;
}

const STATUS_CONFIG: Record<string, { text: string; bg: string; border: string }> = {
  green: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/15', border: 'border-emerald-200 dark:border-emerald-900/30' },
  yellow: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-200 dark:border-amber-900/30' },
  red: { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/15', border: 'border-rose-200 dark:border-rose-900/30' },
};

function SparklineSVG({ values, color }: { values: number[]; color: string }) {
  const w = 200;
  const h = 60;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${w - pad},${h} L ${pad},${h} Z`;

  const lastX = pad + ((values.length - 1) / (values.length - 1)) * (w - pad * 2);
  const lastY = h - pad - ((values[values.length - 1] - min) / range) * (h - pad * 2);

  const colorMap: Record<string, string> = {
    green: '#10b981',
    yellow: '#f59e0b',
    red: '#ef4444',
  };
  const stroke = colorMap[color] ?? '#3b82f6';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#grad-${color})`} />
      <path d={pathD} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={3.5} fill={stroke} stroke="white" strokeWidth={1.5} />
    </svg>
  );
}

export function SparklinePanel({ data, loading }: SparklinePanelProps) {
  const charts = data?.charts ?? [];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {charts.map((chart) => {
          const cfg = STATUS_CONFIG[chart.status] ?? STATUS_CONFIG.yellow;
          const prev = chart.trend[chart.trend.length - 2] ?? chart.current;
          const diff = chart.current - prev;
          const TrendIcon = diff > 0.5 ? TrendingUp : diff < -0.5 ? TrendingDown : Minus;

          return (
            <div
              key={chart.id}
              className={[
                'flex flex-col rounded-lg border p-3 sm:p-4',
                cfg.bg,
                cfg.border,
              ].join(' ')}
            >
              <div className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {chart.label}
              </div>
              <div className="mb-2 h-10 sm:h-12">
                <SparklineSVG values={chart.trend} color={chart.status} />
              </div>
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <div className={`text-lg sm:text-xl font-bold ${cfg.text}`}>
                    {chart.current}
                    <span className="text-xs font-medium text-slate-400 ml-0.5">{chart.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    сейчас
                  </div>
                </div>
                <TrendIcon className={`h-4 w-4 ${cfg.text}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
