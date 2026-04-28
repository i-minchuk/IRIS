import { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Clock, AlertTriangle } from 'lucide-react';
import type { TenderPipelineData } from '../api/analytics';

interface TenderPipelineProps {
  data: TenderPipelineData | null;
  loading?: boolean;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  analysis: { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200' },
  documentation: { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200' },
  pricing: { bg: 'bg-violet-500', text: 'text-violet-700', border: 'border-violet-200' },
  sent: { bg: 'bg-purple-500', text: 'text-purple-700', border: 'border-purple-200' },
  review: { bg: 'bg-fuchsia-500', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
};

export function TenderPipeline({ data, loading }: TenderPipelineProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const stages = data?.stages ?? [];
  const maxCount = data?.max_count || 1;

  if (loading) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-56 animate-pulse rounded" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Тендерный отдел — Pipeline
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Средняя подготовка: <strong style={{ color: 'var(--text-primary)' }}>{data?.avg_prep_days ?? 0} дн</strong>
          </span>
          <span className="flex items-center gap-1">
            Win rate: <strong style={{ color: 'var(--text-primary)' }}>{data?.win_rate ?? 0}%</strong>
          </span>
          {!!data?.overdue_count && (
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Просрочено: {data.overdue_count}
            </span>
          )}
        </div>
      </div>

      {/* Funnel */}
      <div className="flex flex-col items-center gap-2">
        {stages.map((stage) => {
          const colors = STAGE_COLORS[stage.key] ?? STAGE_COLORS.analysis;
          const widthPct = maxCount > 0 ? Math.max(30, (stage.count / maxCount) * 100) : 30;
          const isExpanded = expanded === stage.key;

          return (
            <div key={stage.key} className="w-full flex flex-col items-center">
              <button
                onClick={() => setExpanded(isExpanded ? null : stage.key)}
                className={[
                  'relative flex items-center justify-between rounded-lg border px-4 py-3 text-left',
                  'transition-all duration-200 hover:shadow-md dark:border-slate-600',
                  colors.border,
                  isExpanded ? 'shadow-md' : '',
                ].join(' ')}
                style={{ width: `${widthPct}%`, minWidth: 140 }}
              >
                <div>
                  <div className={`text-sm font-semibold ${colors.text} dark:text-slate-200`}>
                    {stage.label}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {stage.count} шт · {stage.sum_cost_m} млн ₽
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {/* Progress bar inside block */}
                <div
                  className={`absolute bottom-0 left-0 h-1 rounded-b-lg ${colors.bg} opacity-60`}
                  style={{ width: `${widthPct}%` }}
                />
              </button>

              {/* Arrow */}
              <div className="my-0.5 text-slate-300 dark:text-slate-600">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                  style={{ width: `${widthPct}%`, minWidth: 140 }}
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    На этапе «{stage.label}» — {stage.count} тендер(ов).
                    Общая сумма: {stage.sum_cost_m} млн ₽.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
