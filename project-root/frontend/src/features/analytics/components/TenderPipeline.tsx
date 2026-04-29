import { useState } from 'react';
import { ChevronDown, ChevronRight, Target, Clock, AlertTriangle } from 'lucide-react';
import type { TenderPipelineData } from '../api/analytics';

interface TenderPipelineProps {
  data: TenderPipelineData | null;
  loading?: boolean;
}

const STAGE_NEON: Record<string, { gradient: string; glow: string; text: string }> = {
  analysis: { gradient: 'linear-gradient(90deg, #00F0FF, #00C8D4)', glow: 'rgba(0, 240, 255, 0.25)', text: '#00F0FF' },
  documentation: { gradient: 'linear-gradient(90deg, #2979FF, #00F0FF)', glow: 'rgba(41, 121, 255, 0.25)', text: '#2979FF' },
  pricing: { gradient: 'linear-gradient(90deg, #B829DD, #2979FF)', glow: 'rgba(184, 41, 221, 0.25)', text: '#B829DD' },
  sent: { gradient: 'linear-gradient(90deg, #FF00AA, #B829DD)', glow: 'rgba(255, 0, 170, 0.25)', text: '#FF00AA' },
  review: { gradient: 'linear-gradient(90deg, #FF4D6D, #FF00AA)', glow: 'rgba(255, 77, 109, 0.25)', text: '#FF4D6D' },
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
          <Target className="h-5 w-5" style={{ color: '#00F0FF' }} />
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
            <span className="flex items-center gap-1" style={{ color: '#FF4D6D' }}>
              <AlertTriangle className="h-3.5 w-3.5" />
              Просрочено: {data.overdue_count}
            </span>
          )}
        </div>
      </div>

      {/* Funnel */}
      <div className="flex flex-col items-center gap-2">
        {stages.map((stage) => {
          const neon = STAGE_NEON[stage.key] ?? STAGE_NEON.analysis;
          const widthPct = maxCount > 0 ? Math.max(30, (stage.count / maxCount) * 100) : 30;
          const isExpanded = expanded === stage.key;

          return (
            <div key={stage.key} className="w-full flex flex-col items-center">
              <button
                onClick={() => setExpanded(isExpanded ? null : stage.key)}
                className="relative flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200"
                style={{
                  width: `${widthPct}%`,
                  minWidth: 140,
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: isExpanded ? neon.glow.replace('0.25', '0.5') : 'rgba(255,255,255,0.06)',
                  boxShadow: isExpanded ? `0 0 20px ${neon.glow}` : 'none',
                }}
              >
                <div>
                  <div className="text-sm font-semibold" style={{ color: neon.text }}>
                    {stage.label}
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {stage.count} шт · {stage.sum_cost_m} млн ₽
                  </div>
                </div>
                <div className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                {/* Progress bar inside block */}
                <div
                  className="absolute bottom-0 left-0 h-1 rounded-b-lg"
                  style={{
                    width: `${widthPct}%`,
                    background: neon.gradient,
                    boxShadow: `0 0 8px ${neon.glow}`,
                  }}
                />
              </button>

              {/* Arrow */}
              <div className="my-0.5" style={{ color: 'var(--text-muted)' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div
                  className="rounded-lg border p-3"
                  style={{
                    width: `${widthPct}%`,
                    minWidth: 140,
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
