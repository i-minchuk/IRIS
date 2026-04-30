import type { TenderSummary } from '../types/tender';

interface Props {
  summary: TenderSummary | null;
}

function formatMoney(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} млн`;
  return `${(v / 1000).toFixed(0)} тыс`;
}

export function TenderAnalytics({ summary }: Props) {
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

  const pipelineEntries = Object.entries(summary.pipeline).filter(([, v]) => v.count > 0);
  const maxSum = Math.max(...pipelineEntries.map(([, v]) => v.sum_nmc), 1);

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Аналитика
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline bar chart */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Воронка по суммам
          </h4>
          <div className="space-y-2">
            {pipelineEntries.map(([stage, data]) => {
              const stageColors: Record<string, string> = {
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
              const widthPct = (data.sum_nmc / maxSum) * 100;
              return (
                <div key={stage} className="flex items-center gap-2">
                  <span className="text-[10px] w-20 truncate text-right" style={{ color: 'var(--text-secondary)' }}>
                    {stage === 'new' ? 'Новый' : stage === 'qualification' ? 'Квалификация' : stage === 'preparation' ? 'Подготовка' : stage === 'approval' ? 'Согласование' : stage === 'submitted' ? 'Подан' : stage === 'auction' ? 'Аукцион' : stage === 'waiting' ? 'Ожидание' : stage === 'won' ? 'Выигран' : stage === 'lost' ? 'Проигран' : 'Договор'}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden" style={{ background: 'var(--iris-bg-subtle)' }}>
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(widthPct, 2)}%`, background: stageColors[stage] || 'var(--text-muted)' }}
                    />
                  </div>
                  <span className="text-[10px] w-16 text-right font-mono" style={{ color: 'var(--text-muted)' }}>
                    {formatMoney(data.sum_nmc)} ₽
                  </span>
                  <span className="text-[10px] w-6 text-right" style={{ color: 'var(--text-secondary)' }}>
                    {data.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Процент выигрыша — мини-метрики */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Ключевые метрики
          </h4>
          <div className="grid grid-cols-2 gap-3">
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
