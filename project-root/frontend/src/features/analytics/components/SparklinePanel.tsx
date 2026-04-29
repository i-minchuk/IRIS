import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SparklinesData } from '../api/analytics';

interface SparklinePanelProps {
  data: SparklinesData | null;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, { stroke: string; fill: string; glow: string }> = {
  green: { stroke: '#00F0FF', fill: '#00F0FF', glow: 'rgba(0, 240, 255, 0.4)' },
  yellow: { stroke: '#FFAA00', fill: '#FFAA00', glow: 'rgba(255, 170, 0, 0.4)' },
  red: { stroke: '#FF4D6D', fill: '#FF4D6D', glow: 'rgba(255, 77, 109, 0.4)' },
};

function SparklineSVG({ values, colorKey }: { values: number[]; colorKey: string }) {
  const w = 280;
  const h = 80;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y];
  });

  const lineD = `M ${points.map((p) => p.join(',')).join(' L ')}`;
  const areaD = `${lineD} L ${w - pad},${h} L ${pad},${h} Z`;

  const lastX = points[points.length - 1][0];
  const lastY = points[points.length - 1][1];

  const cfg = STATUS_COLORS[colorKey] ?? STATUS_COLORS.yellow;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${colorKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cfg.fill} stopOpacity="0.35" />
          <stop offset="50%" stopColor={cfg.fill} stopOpacity="0.1" />
          <stop offset="100%" stopColor={cfg.fill} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${colorKey}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Area fill */}
      <path d={areaD} fill={`url(#grad-${colorKey})`} />

      {/* Glow line */}
      <path
        d={lineD}
        fill="none"
        stroke={cfg.stroke}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        filter={`url(#glow-${colorKey})`}
        opacity="0.6"
      />

      {/* Main line */}
      <path
        d={lineD}
        fill="none"
        stroke={cfg.stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* End dot with glow */}
      <circle cx={lastX} cy={lastY} r={4} fill={cfg.stroke} filter={`url(#glow-${colorKey})`} />
      <circle cx={lastX} cy={lastY} r={2.5} fill="#0B0E14" stroke={cfg.stroke} strokeWidth={1.5} />
    </svg>
  );
}

export function SparklinePanel({ data, loading }: SparklinePanelProps) {
  const charts = data?.charts ?? [];

  if (loading) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {charts.map((chart) => {
          const cfg = STATUS_COLORS[chart.status] ?? STATUS_COLORS.yellow;
          const prev = chart.trend[chart.trend.length - 2] ?? chart.current;
          const diff = chart.current - prev;
          const TrendIcon = diff > 0.5 ? TrendingUp : diff < -0.5 ? TrendingDown : Minus;

          return (
            <div
              key={chart.id}
              className="flex flex-col rounded-xl p-3 sm:p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 20px ${cfg.glow}`,
              }}
            >
              <div className="mb-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {chart.label}
              </div>
              <div className="mb-2 h-10 sm:h-12">
                <SparklineSVG values={chart.trend} colorKey={chart.status} />
              </div>
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <div className="text-lg sm:text-xl font-bold" style={{ color: cfg.stroke, textShadow: `0 0 12px ${cfg.glow}` }}>
                    {chart.current}
                    <span className="text-xs font-medium ml-0.5" style={{ color: 'var(--text-muted)' }}>{chart.unit}</span>
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    сейчас
                  </div>
                </div>
                <TrendIcon className="h-4 w-4" style={{ color: cfg.stroke, filter: `drop-shadow(0 0 4px ${cfg.glow})` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
