import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui';
import {
  Calculator, BookOpen, Copy, Check,
  ArrowRight, AlertTriangle, CheckCircle2, Sparkles
} from 'lucide-react';
import { tenderExtendedApi } from '@/features/tenders/api/tenderExtended';
import { calculateTender } from '@/features/tenders/api/tenders';
import type { TenderDetail } from '@/features/tenders/types/tender-extended';
import type { ReferenceLibrary } from '@/features/tenders/types/tender-extended';

interface TenderCalculatorTabProps {
  tender: TenderDetail['tender'];
}

export default function TenderCalculatorTab({ tender }: TenderCalculatorTabProps) {
  const [references, setReferences] = useState<ReferenceLibrary | null>(null);
  const [calcResult, setCalcResult] = useState<any>(null);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingCalc, setLoadingCalc] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchReferences = useCallback(async () => {
    setLoadingRefs(true);
    try {
      const res = await tenderExtendedApi.getReferences(tender.id);
      setReferences(res);
    } catch {
      setReferences(null);
    } finally {
      setLoadingRefs(false);
    }
  }, [tender.id]);

  useEffect(() => {
    fetchReferences();
  }, [fetchReferences]);

  const runCalculation = useCallback(async () => {
    setLoadingCalc(true);
    try {
      const res = await calculateTender(tender.id);
      setCalcResult(res);
    } catch {
      setCalcResult(null);
    } finally {
      setLoadingCalc(false);
    }
  }, [tender.id]);

  const copyValue = useCallback((value: string, field: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }, []);

  // Templates for quick calculation
  const templates = useMemo(() => [
    {
      name: 'Базовый расчёт',
      description: 'Расчёт по нормам для типа объекта',
      action: runCalculation,
    },
    {
      name: 'С учётом референсов',
      description: 'Усреднённые данные из похожих тендеров',
      action: () => {
        if (references?.stats) {
          setCalcResult({
            total_hours: references.stats.avg_hours,
            duration_months: references.stats.avg_duration,
            team_size: tender.team_size || 4,
            team_composition: tender.team_composition || {},
            monthly_load: [],
            document_estimate: {},
            overload_risk: false,
            recommendations: ['Расчёт на основе референсных тендеров'],
            source: 'reference',
          });
        }
      },
    },
  ], [runCalculation, references, tender]);

  return (
    <div className="space-y-4">
      {/* Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map(tmpl => (
          <button
            key={tmpl.name}
            onClick={tmpl.action}
            className="flex items-center gap-3 p-3 rounded-lg text-left transition-all hover:opacity-80"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--brand-iris)' }}>
              <Calculator size={18} style={{ color: '#fff' }} />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{tmpl.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{tmpl.description}</div>
            </div>
            <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}
      </div>

      {/* Calculation result */}
      {loadingCalc && (
        <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Расчёт...</div>
      )}

      {calcResult && (
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} style={{ color: '#D4AF37' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Результат расчёта {calcResult.source === 'reference' && '(по референсам)'}
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <CopyableMetric
              label="Трудоёмкость"
              value={`${calcResult.total_hours?.toLocaleString('ru-RU') || '—'} ч`}
              
              color="#2563EB"
              onCopy={() => copyValue(String(calcResult.total_hours || ''), 'hours')}
              copied={copiedField === 'hours'}
            />
            <CopyableMetric
              label="Длительность"
              value={`${calcResult.duration_months || '—'} мес`}
              
              color="#6B5B95"
              onCopy={() => copyValue(String(calcResult.duration_months || ''), 'duration')}
              copied={copiedField === 'duration'}
            />
            <CopyableMetric
              label="Команда"
              value={`${calcResult.team_size || '—'} чел`}
              
              color="#4F7A4C"
              onCopy={() => copyValue(String(calcResult.team_size || ''), 'team')}
              copied={copiedField === 'team'}
            />
            <CopyableMetric
              label="Себестоимость"
              value={tender.calculated_cost ? `₽ ${(tender.calculated_cost / 1e6).toFixed(1)} млн` : '—'}
              
              color="#D4AF37"
              onCopy={() => copyValue(String(tender.calculated_cost || ''), 'cost')}
              copied={copiedField === 'cost'}
            />
          </div>

          {/* Team composition */}
          {calcResult.team_composition && Object.keys(calcResult.team_composition).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Состав команды</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(calcResult.team_composition as Record<string, number>).map(([role, count]) => (
                  <div key={role} className="p-2 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>{roleLabels[role] || role}</div>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{count} чел</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Monthly load */}
          {calcResult.monthly_load && calcResult.monthly_load.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Ежемесячная загрузка</h4>
              <div className="space-y-1">
                {calcResult.monthly_load.map((m: any) => (
                  <div key={m.month} className="flex items-center gap-2 text-xs">
                    <span className="w-12" style={{ color: 'var(--text-muted)' }}>М{m.month}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(m.utilization, 100)}%`,
                          background: m.status === 'risk' ? '#DC2626' : m.status === 'high' ? '#D4AF37' : '#0C7205',
                        }}
                      />
                    </div>
                    <span className="w-16 text-right" style={{ color: 'var(--text-secondary)' }}>{m.hours} ч</span>
                    <span className="w-12 text-right" style={{ color: m.utilization > 85 ? '#DC2626' : 'var(--text-muted)' }}>{m.utilization}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document estimate */}
          {calcResult.document_estimate && Object.keys(calcResult.document_estimate).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Оценка документов</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(calcResult.document_estimate as Record<string, number>).map(([doc, count]) => (
                  <div key={doc} className="p-2 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>
                    <div style={{ color: 'var(--text-muted)' }}>{docLabels[doc] || doc}</div>
                    <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{count} шт</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {calcResult.recommendations && calcResult.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Рекомендации</h4>
              <div className="space-y-1">
                {calcResult.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs p-2 rounded" style={{ background: 'var(--bg-surface-2)' }}>
                    {calcResult.overload_risk ? <AlertTriangle size={10} style={{ color: '#DC2626', marginTop: 2 }} /> : <CheckCircle2 size={10} style={{ color: '#0C7205', marginTop: 2 }} />}
                    <span style={{ color: 'var(--text-secondary)' }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Reference library */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={14} style={{ color: '#6B5B95' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Похожие тендеры (референсы)</h3>
        </div>

        {loadingRefs ? (
          <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
        ) : references && references.references.length > 0 ? (
          <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Средняя маржа</div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{references.stats.avg_margin}%</div>
              </div>
              <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Средние часы</div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{references.stats.avg_hours.toLocaleString('ru-RU')}</div>
              </div>
              <div className="p-2 rounded text-xs" style={{ background: 'var(--bg-surface-2)' }}>
                <div style={{ color: 'var(--text-muted)' }}>Средний срок</div>
                <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{references.stats.avg_duration} мес</div>
              </div>
            </div>

            {/* Reference list */}
            <div className="space-y-2">
              {references.references.map(ref => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 rounded-lg text-xs"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{ref.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(107,91,149,0.12)', color: '#6B5B95' }}>
                        {ref.similarity_score}% похож
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1" style={{ color: 'var(--text-muted)' }}>
                      <span>{ref.customer_name}</span>
                      <span>{ref.volume} {ref.volume_unit}</span>
                      <span>Маржа: {ref.margin_pct}%</span>
                      <span>{ref.calculated_hours?.toLocaleString('ru-RU')} ч</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCalcResult({
                        total_hours: ref.calculated_hours,
                        duration_months: ref.duration_months,
                        team_size: ref.team_size,
                        team_composition: ref.team_composition,
                        monthly_load: [],
                        document_estimate: {},
                        overload_risk: false,
                        recommendations: [`Использованы данные из тендера "${ref.name}"`],
                        source: 'reference',
                      });
                    }}
                    className="px-2 py-1 rounded text-xs font-medium transition-colors"
                    style={{ background: 'var(--brand-iris)', color: '#fff' }}
                  >
                    Применить
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
            Нет похожих тендеров в истории
          </div>
        )}
      </Card>
    </div>
  );
}

function CopyableMetric({ label, value, color, onCopy, copied }: {
  label: string; value: string; color: string;
  onCopy: () => void; copied: boolean;
}) {
  return (
    <div className="p-3 rounded-lg relative group" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
      <button
        onClick={onCopy}
        className="absolute top-1 right-1 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--bg-surface)' }}
      >
        {copied ? <Check size={10} style={{ color: '#0C7205' }} /> : <Copy size={10} style={{ color: 'var(--text-muted)' }} />}
      </button>
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

const roleLabels: Record<string, string> = {
  lead_engineer: 'Ведущий инженер',
  engineer: 'Инженер',
  checker: 'Нормоконтролёр',
  tech_editor: 'Технический редактор',
};

const docLabels: Record<string, string> = {
  assembly_drawing: 'Сборочные чертежи',
  detail_drawing: 'Деталировки',
  specification: 'Спецификации',
  calculation_note: 'Расчётные записки',
  drawing: 'Чертежи',
  explanatory_note: 'Пояснительные записки',
};
