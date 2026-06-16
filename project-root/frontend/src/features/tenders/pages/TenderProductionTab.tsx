import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { Factory, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { tenderExtendedApi } from '@/features/tenders/api/tenderExtended';
import type { ProductionCapacity } from '@/features/tenders/types/tender-extended';

export default function TenderProductionTab({ tenderId }: { tenderId: number }) {
  const [data, setData] = useState<ProductionCapacity | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenderExtendedApi.getProductionCapacity(tenderId);
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tenderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>;
  }

  if (!data) {
    return <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Данные недоступны</div>;
  }

  const { work_centers, summary, tender_hours } = data;

  return (
    <div className="space-y-4">
      {/* Risk banner */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
        style={{
          background: summary.risk === 'high' ? 'rgba(220,38,38,0.08)' : summary.risk === 'medium' ? 'rgba(212,175,55,0.08)' : 'rgba(12,114,5,0.08)',
          border: `1px solid ${summary.risk === 'high' ? 'rgba(220,38,38,0.2)' : summary.risk === 'medium' ? 'rgba(212,175,55,0.2)' : 'rgba(12,114,5,0.2)'}`,
        }}
      >
        {summary.risk === 'high' ? <AlertTriangle size={14} style={{ color: '#DC2626' }} /> : <CheckCircle2 size={14} style={{ color: '#0C7205' }} />}
        <span style={{ color: 'var(--text-primary)' }}>
          {summary.risk === 'high'
            ? `Высокая нагрузка: тендер требует ${summary.tender_impact_pct}% от оставшейся мощности`
            : summary.risk === 'medium'
              ? `Средняя нагрузка: тендер требует ${summary.tender_impact_pct}% от оставшейся мощности`
              : `Нагрузка нормальная: тендер требует ${summary.tender_impact_pct}% от оставшейся мощности`}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Мощность" value={`${summary.total_capacity_hours.toLocaleString('ru-RU')} ч`} color="#2563EB" />
        <StatCard label="Загружено" value={`${summary.total_utilized_hours.toLocaleString('ru-RU')} ч`} color="#D4AF37" />
        <StatCard label="Остаток" value={`${summary.remaining_hours.toLocaleString('ru-RU')} ч`} color="#0C7205" />
        <StatCard label="Тендер" value={`${tender_hours.toLocaleString('ru-RU')} ч`} color="#6B5B95" />
      </div>

      {/* Work centers */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Factory size={14} style={{ color: '#2563EB' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Рабочие центры</h3>
        </div>
        <div className="space-y-3">
          {work_centers.map(wc => (
            <div key={wc.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{wc.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>{wc.code}</span>
                </div>
                <span style={{ color: wc.utilization_pct > 80 ? '#DC2626' : wc.utilization_pct > 50 ? '#D4AF37' : '#0C7205' }}>
                  {wc.utilization_pct}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-default)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(wc.utilization_pct, 100)}%`,
                      background: wc.utilization_pct > 80 ? '#DC2626' : wc.utilization_pct > 50 ? '#D4AF37' : '#0C7205',
                    }}
                  />
                </div>
                <span className="text-[10px] w-20 text-right" style={{ color: 'var(--text-muted)' }}>
                  {wc.planned_hours} / {wc.capacity_hours} ч
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Операций: {wc.active_operations}</span>
                <span>Факт: {wc.actual_hours} ч</span>
                {wc.manager && <span>Руководитель: {wc.manager}</span>}
              </div>
            </div>
          ))}
          {work_centers.length === 0 && (
            <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Нет данных о рабочих центрах
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
      <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
