import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import SrmFormModal, { type SrmField } from '@/features/srm/components/SrmFormModal';
import { createOrder, updateOrder, type PurchaseOrderCreatePayload } from '@/features/srm/api/srmApi';
import type { OrderStatus, PurchaseOrder } from '@/types/srm';
import { Package, Truck, Calendar, Building2, Plus, Send, XCircle } from 'lucide-react';

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

/** ISO-дата из API → ДД.ММ.ГГГГ */
function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ru-RU');
}

/** Маршрут движения заказа: какой статус следующий и как называется действие. */
const NEXT_ACTION: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  draft: { next: 'submitted', label: 'Подать' },
  submitted: { next: 'confirmed', label: 'Подтвердить' },
  confirmed: { next: 'in_production', label: 'В производство' },
  in_production: { next: 'shipped', label: 'Отгрузить' },
  shipped: { next: 'in_transit', label: 'В пути' },
  in_transit: { next: 'customs', label: 'На таможню' },
  customs: { next: 'delivered', label: 'Доставлен' },
  delivered: { next: 'inspection', label: 'На приёмку' },
  inspection: { next: 'accepted', label: 'Принять' },
  accepted: { next: 'completed', label: 'Завершить' },
};

export default function OrdersPage() {
  const orders = useSRMStore(s => s.orders);
  const fetchOrders = useSRMStore(s => s.fetchOrders);
  const contracts = useSRMStore(s => s.contracts);
  const fetchContracts = useSRMStore(s => s.fetchContracts);
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchContracts();
  }, [fetchOrders, fetchContracts]);

  // Автоматическая нумерация заказов в пределах текущего года: ЗК-ГГГГ-NNN
  const nextOrderNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const maxSeq = orders.reduce((max, o) => {
      const m = o.number.match(/^ЗК-(\d{4})-(\d+)$/);
      return m && Number(m[1]) === year ? Math.max(max, Number(m[2])) : max;
    }, 0);
    return `ЗК-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
  }, [orders]);

  const orderFields: SrmField[] = [
    { key: 'number', label: 'Номер заказа', required: true, defaultValue: nextOrderNumber, readOnly: true },
    {
      key: 'contract_id', label: 'Договор', type: 'select', required: true,
      options: contracts.map(c => ({ value: String(c.id), label: `${c.number} — ${c.title}` })),
    },
    { key: 'amount', label: 'Сумма', type: 'number', required: true, placeholder: '0' },
    {
      key: 'currency', label: 'Валюта', type: 'select', required: true, defaultValue: 'RUB',
      options: [
        { value: 'RUB', label: 'RUB' },
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'CNY', label: 'CNY' },
      ],
    },
    { key: 'order_date', label: 'Дата заказа', type: 'date' },
    { key: 'delivery_date', label: 'Дата поставки', type: 'date' },
  ];

  const handleFieldChange = (key: string, value: string, setValue: (k: string, v: string) => void) => {
    if (key === 'contract_id') {
      const contract = contracts.find(c => c.id === Number(value));
      setValue('supplier_name', contract?.supplier_name ?? '');
      setValue('project_id', contract ? String(contract.project_id) : '');
      setValue('project_name', contract?.project_name ?? '');
    }
  };

  const handleCreate = async (values: Record<string, string>) => {
    const payload = {
      number: values.number.trim(),
      contract_id: Number(values.contract_id),
      supplier_name: values.supplier_name ?? '',
      status: 'draft',
      amount: parseFloat(values.amount) || 0,
      currency: values.currency || 'RUB',
      project_id: Number(values.project_id),
      project_name: values.project_name ?? '',
      ...(values.order_date ? { order_date: values.order_date } : {}),
      ...(values.delivery_date ? { delivery_date: values.delivery_date } : {}),
    } as PurchaseOrderCreatePayload;
    await createOrder(payload);
    await fetchOrders();
    toast.success('Заказ создан');
  };

  // Перевод заказа на следующий шаг маршрута (Черновик → Подан → … → Завершён)
  const handleAdvance = async (order: PurchaseOrder) => {
    const action = NEXT_ACTION[order.status];
    if (!action) return;
    try {
      await updateOrder(order.id, { status: action.next });
      await fetchOrders();
      toast.success(`Заказ ${order.number}: ${STATUS_CONFIG[action.next].label}`);
    } catch {
      toast.error('Не удалось изменить статус заказа');
    }
  };

  // Отклонение заказа на приёмке
  const handleReject = async (order: PurchaseOrder) => {
    try {
      await updateOrder(order.id, { status: 'rejected' });
      await fetchOrders();
      toast.success(`Заказ ${order.number}: Отклонён`);
    } catch {
      toast.error('Не удалось изменить статус заказа');
    }
  };

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Заказы</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Трекинг заказов и поставок</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: '#2563EB', color: '#ffffff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
        >
          <Plus size={13} /> Создать заказ
        </button>
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
                    {NEXT_ACTION[order.status] && (
                      <button
                        onClick={() => handleAdvance(order)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                        style={{ color: 'var(--brand-iris)', backgroundColor: 'var(--bg-surface-2)' }}
                      >
                        <Send size={11} /> {NEXT_ACTION[order.status]!.label}
                      </button>
                    )}
                    {order.status === 'inspection' && (
                      <button
                        onClick={() => handleReject(order)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                        style={{ color: 'var(--error)', backgroundColor: 'color-mix(in srgb, var(--error) 8%, var(--bg-surface-2))' }}
                      >
                        <XCircle size={11} /> Отклонить
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1">
                      <Building2 size={12} /> {order.supplier_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> Доставка: {formatDate(order.delivery_date)}
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
                <div className="flex justify-between text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
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

      <SrmFormModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый заказ"
        submitLabel="Создать заказ"
        fields={orderFields}
        onFieldChange={handleFieldChange}
        onSubmit={handleCreate}
      />
    </div>
  );
}
