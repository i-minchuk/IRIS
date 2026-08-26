import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { Truck, Package, Clock, AlertTriangle, CheckCircle2, MapPin, Building2 } from 'lucide-react';
import { tenderExtendedApi } from '@/features/tenders/api/tenderExtended';
import type { ProcurementStatus } from '@/features/tenders/types/tender-extended';

export default function TenderProcurementTab({ tenderId }: { tenderId: number }) {
  const [data, setData] = useState<ProcurementStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenderExtendedApi.getProcurementStatus(tenderId);
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

  const { materials, summary } = data;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'Не заказано', color: '#6B7280', icon: <Clock size={12} /> },
    ordered: { label: 'Заказано', color: '#2563EB', icon: <Truck size={12} /> },
    in_transit: { label: 'В пути', color: '#D4AF37', icon: <Truck size={12} /> },
    delivered: { label: 'На складе', color: '#0C7205', icon: <CheckCircle2 size={12} /> },
    cancelled: { label: 'Отменено', color: '#DC2626', icon: <AlertTriangle size={12} /> },
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Позиций" value={summary.total_items} color="#2563EB" />
        <StatCard label="Заказано" value={summary.ordered} color="#D4AF37" />
        <StatCard label="На складе" value={summary.delivered} color="#0C7205" />
        <StatCard label="Стоимость" value={`₽ ${(summary.total_cost / 1e6).toFixed(1)} млн`} color="#6B5B95" />
      </div>

      {/* Materials list */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Package size={14} style={{ color: '#2563EB' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Материалы и оборудование</h3>
        </div>
        <div className="space-y-2">
          {materials.map(mat => {
            const cfg = statusConfig[mat.status] || statusConfig.pending;
            return (
              <div
                key={mat.id}
                className="flex items-center justify-between p-3 rounded-lg text-xs"
                style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>{mat.name}</div>
                  <div className="flex items-center gap-3 mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>{mat.quantity} {mat.unit}</span>
                    <span>≈ ₽ {mat.estimated_cost.toLocaleString('ru-RU')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {mat.supplier && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Building2 size={10} /> {mat.supplier}
                    </span>
                  )}
                  {mat.delivery_date && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <Clock size={10} /> {new Date(mat.delivery_date).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                  {mat.warehouse_location && (
                    <span className="flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <MapPin size={10} /> {mat.warehouse_location}
                    </span>
                  )}
                  <span
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded font-medium"
                    style={{ background: cfg.color + '15', color: cfg.color }}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
              </div>
            );
          })}
          {materials.length === 0 && (
            <div className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
              Нет данных о материалах
            </div>
          )}
        </div>
      </Card>

      {/* Delivery timeline placeholder */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Truck size={14} style={{ color: '#D4AF37' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>График поставок</h3>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          График поставок будет доступен после создания заказов на закупку.
          <br />
          Используйте раздел <strong style={{ color: 'var(--text-primary)' }}>Закупка/МТО</strong> для управления поставками.
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
