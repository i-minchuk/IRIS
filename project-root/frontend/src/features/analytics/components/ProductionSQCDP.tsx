import { useState } from 'react';
import { ShieldCheck, Gauge, Coins, Truck, Users, ChevronDown, ChevronRight } from 'lucide-react';
import type { SqcdpData, SqcdpPillar } from '../api/analytics';

interface ProductionSQCDPProps {
  data: SqcdpData | null;
  loading?: boolean;
}

const PILLAR_META: Record<string, { icon: React.ElementType; color: string }> = {
  safety: { icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  quality: { icon: Gauge, color: 'text-blue-600 dark:text-blue-400' },
  cost: { icon: Coins, color: 'text-amber-600 dark:text-amber-400' },
  delivery: { icon: Truck, color: 'text-purple-600 dark:text-purple-400' },
  people: { icon: Users, color: 'text-cyan-600 dark:text-cyan-400' },
};

const STATUS_DOT: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-500',
  red: 'bg-rose-500',
};

function PillarDetails({ pillar }: { pillar: SqcdpPillar }) {
  const d = pillar.details as Record<string, any>;

  if (pillar.id === 'quality') {
    const shifts = (d.shifts as { name: string; fpy: number }[]) ?? [];
    const defects = (d.top_defects as { name: string; pct: number }[]) ?? [];
    return (
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">FPY по сменам:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {shifts.map((s) => (
              <span key={s.name} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                {s.name}: <strong>{s.fpy}%</strong>
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">Топ-3 дефектов:</span>
          <ol className="mt-1 list-decimal pl-4">
            {defects.map((def) => (
              <li key={def.name}>{def.name} ({def.pct}%)</li>
            ))}
          </ol>
        </div>
        <div>
          Партии на повторной приёмке: <strong>{d.rework_batches}</strong> ({d.rework_tons} тонн)
        </div>
      </div>
    );
  }

  if (pillar.id === 'cost') {
    const overruns = (d.top_overruns as { name: string; pct: number }[]) ?? [];
    return (
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div>Бюджет: {d.budget_m} млн ₽ · Факт: {d.actual_m} млн ₽</div>
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">Топ перерасходов:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {overruns.map((o) => (
              <span key={o.name} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
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
      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div>План: {d.plan_units} ед · Факт: {d.actual_units} ед · Выполнение: {d.completion_pct}%</div>
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">Причины задержек:</span>
          <div className="mt-1 flex flex-wrap gap-3">
            {reasons.map((r) => (
              <span key={r.name} className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
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
      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
        <div>Всего: {d.total_headcount} чел · Присутствует: {d.present}</div>
        <div>Пропуски: {d.absence_pct}% · Среднее обучение: {d.training_hours_avg} ч/мес</div>
      </div>
    );
  }

  if (pillar.id === 'safety') {
    return (
      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
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
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-700 dark:bg-[#1e293b]">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Gauge className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">
          Производство — SQCDP
        </h3>
      </div>

      {/* Pillars */}
      <div className="space-y-2">
        {pillars.map((pillar) => {
          const meta = PILLAR_META[pillar.id] ?? { icon: Gauge, color: 'text-slate-600' };
          const Icon = meta.icon;
          const isExpanded = expanded === pillar.id;

          return (
            <div
              key={pillar.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : pillar.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <Icon className={`h-5 w-5 shrink-0 ${meta.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {pillar.label}
                    </span>
                    <span className={`h-2 w-2 rounded-full ${STATUS_DOT[pillar.status]}`} />
                  </div>
                </div>
                <div className="hidden sm:block text-sm text-slate-600 dark:text-slate-400">
                  {pillar.value}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {pillar.target}
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
              </button>

              {/* Mobile value */}
              <div className="px-4 pb-2 sm:hidden">
                <span className="text-xs text-slate-600 dark:text-slate-400">{pillar.value}</span>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-100 px-4 py-3 dark:border-slate-700">
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
