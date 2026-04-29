import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Tender, TenderStage } from '../types/tender';

interface Props {
  tenders: Tender[];
  selectedStage: TenderStage | null;
}

const STAGE_META: Record<TenderStage, { label: string; color: string }> = {
  new:           { label: 'Новый',        color: 'var(--text-muted)' },
  qualification: { label: 'Квалификация', color: 'var(--iris-accent-amber)' },
  preparation:   { label: 'Подготовка',   color: 'var(--iris-accent-blue)' },
  approval:      { label: 'Согласование', color: 'var(--iris-accent-purple)' },
  submitted:     { label: 'Подан',        color: 'var(--iris-accent-cyan)' },
  auction:       { label: 'Аукцион',      color: 'var(--iris-accent-amber)' },
  waiting:       { label: 'Ожидание',     color: 'var(--iris-accent-blue)' },
  won:           { label: 'Выигран',      color: '#2E8B57' },
  lost:          { label: 'Проигран',     color: 'var(--iris-accent-coral)' },
  contract:      { label: 'Договор',      color: '#1E6B3A' },
};

function formatMoney(v?: number): string {
  if (v == null) return '—';
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)} млрд ₽`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} млн ₽`;
  return `${v.toLocaleString('ru-RU')} ₽`;
}

function daysLeft(deadline?: string): string {
  if (!deadline) return '—';
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `просрочено ${Math.abs(diff)} дн`;
  if (diff === 0) return 'сегодня';
  return `${diff} дн`;
}

function MarginBadge({ pct }: { pct?: number }) {
  if (pct == null) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const color = pct >= 25 ? 'var(--iris-accent-cyan)' : pct >= 15 ? 'var(--iris-accent-amber)' : 'var(--iris-accent-coral)';
  return (
    <span className="text-xs font-semibold" style={{ color }}>
      {pct.toFixed(1)}%
    </span>
  );
}

export function TenderRegistry({ tenders, selectedStage }: Props) {
  const [sortField, setSortField] = useState<'deadline' | 'nmc' | 'margin'>('deadline');
  const [sortDesc, setSortDesc] = useState(false);

  let filtered = selectedStage ? tenders.filter((t) => t.stage === selectedStage) : tenders;
  filtered = [...filtered].sort((a, b) => {
    let av: number | string | undefined;
    let bv: number | string | undefined;
    if (sortField === 'deadline') { av = a.deadline; bv = b.deadline; }
    else if (sortField === 'nmc') { av = a.nmc ?? 0; bv = b.nmc ?? 0; }
    else { av = a.margin_pct ?? 0; bv = b.margin_pct ?? 0; }
    if (av == null) av = '';
    if (bv == null) bv = '';
    if (av < bv) return sortDesc ? 1 : -1;
    if (av > bv) return sortDesc ? -1 : 1;
    return 0;
  });

  const toggleSort = (field: 'deadline' | 'nmc' | 'margin') => {
    if (sortField === field) setSortDesc((d) => !d);
    else { setSortField(field); setSortDesc(false); }
  };

  return (
    <div className="rounded-2xl p-4 sm:p-6 neon-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Реестр тендеров
          {selectedStage && (
            <span className="ml-2 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
              · {STAGE_META[selectedStage].label}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2 text-[10px]">
          <button onClick={() => toggleSort('deadline')} className="flex items-center gap-0.5 px-2 py-1 rounded" style={{ background: sortField === 'deadline' ? 'var(--iris-bg-hover)' : 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}>
            Дедлайн {sortField === 'deadline' && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
          </button>
          <button onClick={() => toggleSort('nmc')} className="flex items-center gap-0.5 px-2 py-1 rounded" style={{ background: sortField === 'nmc' ? 'var(--iris-bg-hover)' : 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}>
            Сумма {sortField === 'nmc' && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
          </button>
          <button onClick={() => toggleSort('margin')} className="flex items-center gap-0.5 px-2 py-1 rounded" style={{ background: sortField === 'margin' ? 'var(--iris-bg-hover)' : 'var(--iris-bg-subtle)', color: 'var(--text-secondary)' }}>
            Маржа {sortField === 'margin' && (sortDesc ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />)}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--iris-border-subtle)' }}>
              <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>№</th>
              <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Название / Заказчик</th>
              <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Стадия</th>
              <th className="text-right py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>НМЦ</th>
              <th className="text-right py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Наша цена</th>
              <th className="text-right py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Маржа</th>
              <th className="text-center py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Вер-ть</th>
              <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Дедлайн</th>
              <th className="text-left py-2 px-2 font-semibold" style={{ color: 'var(--text-muted)' }}>Площадка</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const stage = STAGE_META[t.stage];
              return (
                <tr
                  key={t.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid var(--iris-border-subtle)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td className="py-2.5 px-2 font-mono" style={{ color: 'var(--text-secondary)' }}>#{t.id}</td>
                  <td className="py-2.5 px-2">
                    <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.customer_name}</div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: stage.color, background: `${stage.color}15` }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: stage.color }} />
                      {stage.label}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{formatMoney(t.nmc)}</td>
                  <td className="py-2.5 px-2 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{formatMoney(t.our_price)}</td>
                  <td className="py-2.5 px-2 text-right"><MarginBadge pct={t.margin_pct} /></td>
                  <td className="py-2.5 px-2 text-center">
                    {t.probability != null ? (
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-8 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--iris-bg-subtle)' }}>
                          <div className="h-full rounded-full" style={{ width: `${t.probability}%`, background: t.probability >= 70 ? 'var(--iris-accent-cyan)' : t.probability >= 40 ? 'var(--iris-accent-amber)' : 'var(--iris-accent-coral)' }} />
                        </div>
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{t.probability}%</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className={daysLeft(t.deadline).includes('просроч') ? 'text-[var(--iris-accent-coral)]' : ''} style={{ color: daysLeft(t.deadline).includes('просроч') ? 'var(--iris-accent-coral)' : 'var(--text-secondary)' }}>
                      {daysLeft(t.deadline)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2" style={{ color: 'var(--text-muted)' }}>{t.platform || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Нет тендеров по выбранному фильтру
        </div>
      )}
    </div>
  );
}
