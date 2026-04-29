import type { Tender, TenderStage, TenderSummary } from '../types/tender';

interface Props {
  tenders: Tender[];
  summary: TenderSummary | null;
  onStageClick?: (stage: TenderStage) => void;
}

const STAGE_META: Record<TenderStage, { label: string; color: string; glow: string }> = {
  new:           { label: 'Новый',           color: 'var(--text-muted)',        glow: 'var(--iris-glow-blue)' },
  qualification: { label: 'Квалификация',    color: 'var(--iris-accent-amber)', glow: 'var(--iris-glow-amber)' },
  preparation:   { label: 'Подготовка',      color: 'var(--iris-accent-blue)',  glow: 'var(--iris-glow-blue)' },
  approval:      { label: 'Согласование',    color: 'var(--iris-accent-purple)',glow: 'var(--iris-glow-purple)' },
  submitted:     { label: 'Подан',           color: 'var(--iris-accent-cyan)',  glow: 'var(--iris-glow-cyan)' },
  auction:       { label: 'Аукцион',         color: 'var(--iris-accent-amber)', glow: 'var(--iris-glow-amber)' },
  waiting:       { label: 'Ожидание',        color: 'var(--iris-accent-blue)',  glow: 'var(--iris-glow-blue)' },
  won:           { label: 'Выигран',         color: '#2E8B57',                  glow: 'var(--iris-glow-cyan)' },
  lost:          { label: 'Проигран',        color: 'var(--iris-accent-coral)', glow: 'var(--iris-glow-coral)' },
  contract:      { label: 'Договор',         color: '#1E6B3A',                  glow: 'var(--iris-glow-cyan)' },
};

const STAGE_ORDER: TenderStage[] = [
  'new', 'qualification', 'preparation', 'approval', 'submitted',
  'auction', 'waiting', 'won', 'lost', 'contract',
];

function formatMoney(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)} млн`;
  return `${(v / 1000).toFixed(0)} тыс`;
}

export function TenderPipeline({ tenders, summary, onStageClick }: Props) {
  if (!summary) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-48 animate-pulse rounded" style={{ background: 'var(--iris-bg-skeleton)' }} />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {STAGE_ORDER.map((s) => (
            <div key={s} className="min-w-[120px] h-32 animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Воронка тендеров
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {tenders.length} тендеров всего
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 folder-tabs-scroll">
        {STAGE_ORDER.map((stage) => {
          const meta = STAGE_META[stage];
          const info = summary.pipeline[stage] || { count: 0, sum_nmc: 0 };
          const stageTenders = tenders.filter((t) => t.stage === stage);

          return (
            <button
              key={stage}
              onClick={() => onStageClick?.(stage)}
              className="min-w-[140px] flex-shrink-0 rounded-lg border p-3 text-left transition-all duration-200 hover:scale-[1.02]"
              style={{
                borderColor: 'var(--iris-border-subtle)',
                background: 'var(--iris-bg-subtle)',
              }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="h-2 w-2 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.glow}` }} />
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: meta.color }}>
                  {meta.label}
                </span>
              </div>
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {info.count}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {formatMoney(info.sum_nmc)} ₽
              </div>
              {/* Mini preview of tender names */}
              <div className="mt-2 space-y-1">
                {stageTenders.slice(0, 2).map((t) => (
                  <div key={t.id} className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                    {t.name}
                  </div>
                ))}
                {stageTenders.length > 2 && (
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    +{stageTenders.length - 2} ещё
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
