import { useState } from 'react';
import { ShieldCheck, Gauge, Coins, Truck, Users, ChevronDown, ChevronRight } from 'lucide-react';
import type { SqcdpData, SqcdpPillar } from '../api/analytics';

interface ProductionSQCDPProps {
  data: SqcdpData | null;
  loading?: boolean;
}

const PILLAR_META: Record<string, { icon: React.ElementType; color: string; glow: string }> = {
  safety:  { icon: ShieldCheck, color: 'var(--iris-accent-cyan)',    glow: 'var(--iris-glow-cyan)' },
  quality: { icon: Gauge,       color: 'var(--iris-accent-blue)',    glow: 'var(--iris-glow-blue)' },
  cost:    { icon: Coins,       color: 'var(--iris-accent-amber)',   glow: 'var(--iris-glow-amber)' },
  delivery:{ icon: Truck,       color: 'var(--iris-accent-purple)',  glow: 'var(--iris-glow-purple)' },
  people:  { icon: Users,       color: 'var(--iris-accent-magenta)', glow: 'var(--iris-glow-magenta)' },
};

const STATUS_DOT: Record<string, { color: string; glow: string }> = {
  green: { color: 'var(--iris-accent-cyan)',  glow: '0 0 6px var(--iris-glow-cyan)' },
  yellow:{ color: 'var(--iris-accent-amber)', glow: '0 0 6px var(--iris-glow-amber)' },
  red:   { color: 'var(--iris-accent-coral)', glow: '0 0 6px var(--iris-glow-coral)' },
};

function PillarDetails({ pillar }: { pillar: SqcdpPillar }) {
  const d = pillar.details as Record<string, any>;

  if (pillar.id === 'quality') {
    const shifts = (d.shifts as { name: string; fpy: number }[]) ?? [];
    const defects = (d.top_defects as { name: string; pct: number }[]) ?? [];
    return (
      <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div>
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>FPY по сменам:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {shifts.map((s) => (
              <span key={s.name} className="rounded px-2 py-0.5" style={{ background: 'var(--iris-bg-subtle)' }}>
                {s.name}: <strong>{s.fpy}%</strong>
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Топ-3 дефектов:</span>
          <ol className="mt-1 list-decimal pl-4">
            {defects.map((def) => (
              <li key={def.name}>{def.name} ({def.pct}%)</li>
            ))}
          </ol>
        </div>
        <div>Партии на повторной приёмке: <strong>{d.rework_batches}</strong> ({d.rework_tons} тонн)</div>
      </div>
    );
  }

  if (pillar.id === 'cost') {
    const overruns = (d.top_overruns as { name: string; pct: number }[]) ?? [];
    return (
      <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div>Бюджет: {d.budget_m} млн ₽ · Факт: {d.actual_m} млн ₽</div>
        <div>
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Топ перерасходов:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {overruns.map((o) => (
              <span key={o.name} className="rounded px-2 py-0.5" style={{ background: 'var(--iris-bg-subtle)' }}>
                {o.name}: <strong>+{o.pct}%</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pillar.id === 'delivery') {
    const reasons = (d.delay_reasons as { name: string; count: number }[]) ?? [];
    return (
      <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div>План: {d.plan_units} ед · Факт: {d.actual_units} ед · Выполнение: {d.completion_pct}%</div>
        <div>
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Причины задержек:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {reasons.map((r) => (
              <span key={r.name} className="rounded px-2 py-0.5" style={{ background: 'var(--iris-bg-subtle)' }}>
                {r.name}: <strong>{r.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (pillar.id === 'people') {
    return (
      <div className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div>Всего: {d.total_headcount} чел · Присутствует: {d.present}</div>
        <div>Пропуски: {d.absence_pct}% · Среднее обучение: {d.training_hours_avg} ч/мес</div>
      </div>
    );
  }

  if (pillar.id === 'safety') {
    return (
      <div className="space-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div>Дней без инцидентов: <strong>{d.days_without}</strong></div>
        <div>Прохождение обучения: {d.training_completion}</div>
      </div>
    );
  }

  return null;
}

export function ProductionSQCDP({ data, loading }: ProductionSQCDPProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const pillars = data?.pillars ?? [];

  if (loading) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 neon-card">
        <div className="mb-4 h-6 w-48 animate-pulse rounded" style={{ background: 'var(--iris-bg-skeleton)' }} />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg" style={{ background: 'var(--iris-bg-skeleton)' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-5 w-5" style={{ color: 'var(--iris-accent-purple)' }} />
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Производство — SQCDP
        </h3>
      </div>

      {/* Pillars */}
      <div className="space-y-2">
        {pillars.map((pillar) => {
          const meta = PILLAR_META[pillar.id] ?? { icon: Gauge, color: 'var(--text-muted)', glow: 'none' };
          const Icon = meta.icon;
          const isExpanded = expanded === pillar.id;
          const dot = STATUS_DOT[pillar.status] ?? STATUS_DOT.green;

          return (
            <div
              key={pillar.id}
              className="rounded-lg border overflow-hidden transition-all duration-200"
              style={{
                borderColor: isExpanded ? meta.color : 'var(--iris-border-subtle)',
                boxShadow: isExpanded ? `0 0 20px ${meta.glow}` : 'none',
              }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : pillar.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon className="h-5 w-5 shrink-0" style={{ color: meta.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {pillar.label}
                    </span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot.color, boxShadow: dot.glow }} />
                  </div>
                </div>
                <div className="hidden sm:block text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {pillar.value}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {pillar.target}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                ) : (
                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              {/* Mobile value */}
              <div className="px-4 pb-2 sm:hidden">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{pillar.value}</span>
              </div>

              {isExpanded && (
                <div className="border-t px-4 py-3" style={{ borderColor: 'var(--iris-border-subtle)' }}>
                  <PillarDetails pillar={pillar} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
