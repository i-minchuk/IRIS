import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import type { OrderStatus } from '@/types/srm';
import { Package, Truck, Calendar, Building2 } from 'lucide-react';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'; step: number }> = {
  draft: { label: 'Черновик', variant: 'neutral', step: 1 },
  submitted: { label: 'Подан', variant: 'info', step: 2 },
  confirmed: { label: 'Подтверждён', variant: 'info', step: 3 },
  in_production: { label: 'В производстве', variant: 'warning', step: 4 },
  shipped: { label: 'Отгружен', variant: 'warning', step: 5 },
  in_transit: { label: 'В пути', variant: 'warning', step: 6 },
  customs: { label: 'Таможня', variant: 'warning', step: 7 },
  delivered: { label: 'Доставлен', variant: 'info', step: 8 },
  inspection: { label: 'Приёмка', variant: 'info', step: 9 },
  accepted: { label: 'Принят', variant: 'success', step: 10 },
  rejected: { label: 'Отклонён', variant: 'error', step: 10 },
  completed: { label: 'Завершён', variant: 'success', step: 11 },
};

const TOTAL_STEPS = 11;

export default function OrdersPage() {
  const orders = useSRMStore(s => s.orders);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Заказы</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Трекинг заказов и поставок</p>
      </div>

      <div className="space-y-4">
        {orders.map(order => {
          const status = STATUS_CONFIG[order.status];
          const progress = (status.step / TOTAL_STEPS) * 100;

          return (
            <Card key={order.id} padding="md">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package size={16} style={{ color: 'var(--brand-iris)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{order.number}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {order.supplier_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Доставка: {order.delivery_date}
                    </span>
                    <span>Проект: {order.project_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {order.amount.toLocaleString('ru-RU')} {order.currency}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><Truck size={12} /> Прогресс</span>
                  <span>{status.step} / {TOTAL_STEPS}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: order.status === 'rejected' ? 'var(--error)' : 'var(--brand-iris)',
                    }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
