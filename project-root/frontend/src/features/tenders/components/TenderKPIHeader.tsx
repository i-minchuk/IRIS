import { Target, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import type { TenderSummary } from '../types/tender';

interface Props {
  summary: TenderSummary | null;
  loading?: boolean;
}

function formatMoney(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд ₽`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₽`;
  return `${v.toLocaleString('ru-RU')} ₽`;
}

export function TenderKPIHeader({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl neon-card" style={{ background: 'var(--iris-bg-skeleton)' }} />
        ))}
      </div>
    );
  }

  const tiles = [
    {
      label: 'Активные заказы',
      value: String(summary.active_count),
      sub: formatMoney(summary.active_sum),
      icon: Target,
      color: 'var(--iris-accent-cyan)',
      glow: 'var(--iris-glow-cyan)',
    },
    {
      label: 'Объём активных',
      value: formatMoney(summary.active_sum),
      sub: 'Начальная цена суммарно',
      icon: TrendingUp,
      color: 'var(--iris-accent-blue)',
      glow: 'var(--iris-glow-blue)',
    },
    {
      label: 'Процент выигрыша',
      value: `${summary.win_rate}%`,
      sub: `${summary.won_count} выиграно`,
      icon: summary.win_rate >= 30 ? TrendingUp : summary.win_rate >= 15 ? Minus : TrendingDown,
      color: summary.win_rate >= 30 ? 'var(--iris-accent-cyan)' : summary.win_rate >= 15 ? 'var(--iris-accent-amber)' : 'var(--iris-accent-coral)',
      glow: summary.win_rate >= 30 ? 'var(--iris-glow-cyan)' : summary.win_rate >= 15 ? 'var(--iris-glow-amber)' : 'var(--iris-glow-coral)',
    },
    {
      label: 'На аукционе',
      value: String(summary.auction_now),
      sub: 'требуют внимания',
      icon: Zap,
      color: 'var(--iris-accent-amber)',
      glow: 'var(--iris-glow-amber)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <div
            key={tile.label}
            className="relative rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: 'var(--iris-bg-card)',
              border: '1px solid var(--iris-border-subtle)',
              boxShadow: `var(--iris-shadow-card), 0 0 16px ${tile.glow}`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {tile.label}
              </span>
              <Icon className="h-4 w-4" style={{ color: tile.color }} />
            </div>
            <div className="text-xl sm:text-2xl font-bold" style={{ color: tile.color, textShadow: `0 0 8px ${tile.glow}` }}>
              {tile.value}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {tile.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
}
