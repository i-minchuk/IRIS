import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import SrmFormModal, { type SrmField } from '@/features/srm/components/SrmFormModal';
import { createInvoice, updateInvoice, type InvoiceCreatePayload } from '@/features/srm/api/srmApi';
import type { Invoice, InvoiceStatus } from '@/types/srm';
import { FileText, Calendar, AlertCircle, TrendingUp, Plus, Send } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  received: { label: 'Получен', variant: 'neutral' },
  verified: { label: 'Проверен', variant: 'info' },
  approved: { label: 'Утверждён', variant: 'success' },
  paid: { label: 'Оплачен', variant: 'success' },
  overdue: { label: 'Просрочен', variant: 'error' },
  cancelled: { label: 'Отменён', variant: 'error' },
};

/** Цветовая маркировка карточки по статусу счёта. */
const STATUS_BORDER: Record<InvoiceStatus, string> = {
  received: 'var(--text-tertiary)',
  verified: 'var(--brand-iris)',
  approved: 'var(--warning)',
  paid: 'var(--success)',
  overdue: 'var(--error)',
  cancelled: '#9CA3AF',
};

/** ISO-дата из API → ДД.ММ.ГГГГ */
function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ru-RU');
}

/** Маршрут движения счёта: какой статус следующий и как называется действие. */
const NEXT_ACTION: Partial<Record<InvoiceStatus, { next: InvoiceStatus; label: string }>> = {
  received: { next: 'verified', label: 'Проверить' },
  verified: { next: 'approved', label: 'Утвердить' },
  approved: { next: 'paid', label: 'Оплатить' },
};

type SortMode = 'issue_desc' | 'issue_asc' | 'due_asc';

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: 'issue_desc', label: 'Сначала новые' },
  { value: 'issue_asc', label: 'Сначала старые' },
  { value: 'due_asc', label: 'По сроку оплаты' },
];

export default function InvoicesPage() {
  const invoices = useSRMStore(s => s.invoices);
  const fetchInvoices = useSRMStore(s => s.fetchInvoices);
  const contracts = useSRMStore(s => s.contracts);
  const fetchContracts = useSRMStore(s => s.fetchContracts);
  const orders = useSRMStore(s => s.orders);
  const fetchOrders = useSRMStore(s => s.fetchOrders);
  const purchaseRequests = useSRMStore(s => s.purchaseRequests);
  const fetchPurchaseRequests = useSRMStore(s => s.fetchPurchaseRequests);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('issue_desc');

  useEffect(() => {
    fetchInvoices();
    fetchContracts();
    fetchOrders();
    fetchPurchaseRequests();
  }, [fetchInvoices, fetchContracts, fetchOrders, fetchPurchaseRequests]);

  const invoiceFields: SrmField[] = [
    { key: 'number', label: 'Номер счёта', required: true, placeholder: 'СЧ-2026-001' },
    {
      key: 'contract_id', label: 'Договор', type: 'select', required: true,
      options: contracts.map(c => ({ value: String(c.id), label: `${c.number} — ${c.title}` })),
    },
    {
      key: 'order_id', label: 'Заказ (необязательно)', type: 'select',
      options: orders.map(o => ({ value: String(o.id), label: o.number })),
    },
    {
      key: 'purchase_request_id', label: 'Заявка на закупку (необязательно)', type: 'select',
      options: purchaseRequests.map(r => ({ value: String(r.id), label: `${r.number || `#${r.id}`} — ${r.title}` })),
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
    { key: 'issue_date', label: 'Дата выставления', type: 'date' },
    { key: 'due_date', label: 'Оплатить до', type: 'date' },
  ];

  const handleFieldChange = (key: string, value: string, setValue: (k: string, v: string) => void) => {
    if (key === 'contract_id') {
      const contract = contracts.find(c => c.id === Number(value));
      setValue('supplier_name', contract?.supplier_name ?? '');
    }
    // Выбор заявки подставляет сумму и валюту счёта
    if (key === 'purchase_request_id') {
      const request = purchaseRequests.find(r => r.id === Number(value));
      if (request) {
        setValue('amount', String(request.amount));
        setValue('currency', request.currency);
      }
    }
  };

  // Перевод счёта на следующий шаг маршрута (Получен → Проверен → Утверждён → Оплачен)
  const handleAdvance = async (invoice: Invoice) => {
    const action = NEXT_ACTION[invoice.status];
    if (!action) return;
    try {
      await updateInvoice(invoice.id, {
        status: action.next,
        ...(action.next === 'paid' ? { paid_date: new Date().toISOString() } : {}),
      });
      await fetchInvoices();
      toast.success(`Счёт ${invoice.number}: ${STATUS_CONFIG[action.next].label}`);
    } catch {
      toast.error('Не удалось изменить статус счёта');
    }
  };

  const handleCreate = async (values: Record<string, string>) => {
    const payload = {
      number: values.number.trim(),
      supplier_name: values.supplier_name ?? '',
      contract_id: Number(values.contract_id),
      status: 'received',
      amount: parseFloat(values.amount) || 0,
      currency: values.currency || 'RUB',
      ...(values.order_id ? { order_id: Number(values.order_id) } : {}),
      ...(values.issue_date ? { issue_date: values.issue_date } : {}),
      ...(values.due_date ? { due_date: values.due_date } : {}),
    } as InvoiceCreatePayload;
    await createInvoice(payload);
    await fetchInvoices();
    toast.success('Счёт создан');
  };

  // Use useMemo to avoid recalculating on every render and prevent infinite loops
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalPayable = invoices
      .filter(i => ['received', 'verified', 'approved', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + i.amount, 0);
    const overdueInvoices = invoices.filter(i => i.status === 'overdue').length;
    const approvedCount = invoices.filter(i => i.status === 'approved').length;
    const overdue = invoices.filter(i => i.status === 'overdue');
    return { totalInvoices, totalPayable, overdueInvoices, approvedCount, overdue };
  }, [invoices]);

  // Сортировка списка счетов по датам
  const sortedInvoices = useMemo(() => {
    const ts = (s?: string) => {
      if (!s) return 0;
      const t = new Date(s).getTime();
      return isNaN(t) ? 0 : t;
    };
    const arr = [...invoices];
    if (sortMode === 'issue_desc') arr.sort((a, b) => ts(b.issue_date) - ts(a.issue_date));
    else if (sortMode === 'issue_asc') arr.sort((a, b) => ts(a.issue_date) - ts(b.issue_date));
    else arr.sort((a, b) => ts(a.due_date) - ts(b.due_date));
    return arr;
  }, [invoices, sortMode]);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Счета и платежи</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Управление счетами к оплате</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: '#2563EB', color: '#ffffff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
        >
          <Plus size={13} /> Создать счёт
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <FileText size={18} style={{ color: 'var(--brand-iris)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalInvoices}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Всего счетов</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, var(--bg-surface))' }}>
            <TrendingUp size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>
              {(stats.totalPayable / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>К оплате</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, var(--bg-surface))' }}>
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--error)' }}>{stats.overdueInvoices}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Просрочено</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))' }}>
            <Calendar size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>
              {stats.approvedCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>На оплату</div>
          </div>
        </Card>
      </div>

      {stats.overdue.length > 0 && (
        <Card padding="md" style={{ borderColor: 'var(--error)', borderWidth: '1px' }}>
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--error)' }}>
            <AlertCircle size={16} /> Просроченные счета
          </h3>
          <div className="space-y-2">
            {stats.overdue.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 5%, var(--bg-surface))' }}>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{inv.number}</span>
                  <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>{inv.supplier_name}</span>
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--error)' }}>
                  {inv.amount.toLocaleString('ru-RU')} {inv.currency}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-end gap-2">
        <label className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Сортировка:</label>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          className="text-xs px-2 py-1.5 rounded-md border cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-surface-2)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-3">
        {sortedInvoices.map(invoice => (
          <Card
            key={invoice.id}
            padding="md"
            className="hover:opacity-90 transition-opacity cursor-pointer"
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: STATUS_BORDER[invoice.status],
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: STATUS_BORDER[invoice.status] }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{invoice.number}</span>
                    <Badge variant={STATUS_CONFIG[invoice.status].variant}>
                      {STATUS_CONFIG[invoice.status].label}
                    </Badge>
                    {NEXT_ACTION[invoice.status] && (
                      <button
                        onClick={() => handleAdvance(invoice)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                        style={{ color: 'var(--brand-iris)', backgroundColor: 'var(--bg-surface-2)' }}
                      >
                        <Send size={11} /> {NEXT_ACTION[invoice.status]!.label}
                      </button>
                    )}
                  </div>
                  <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {invoice.supplier_name} • Выставлен: {formatDate(invoice.issue_date)} • Оплата до: {formatDate(invoice.due_date)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {invoice.amount.toLocaleString('ru-RU')} {invoice.currency}
                </div>
                {invoice.paid_date && (
                  <div className="text-xs" style={{ color: 'var(--success)' }}>Оплачен: {formatDate(invoice.paid_date)}</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SrmFormModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый счёт"
        submitLabel="Создать счёт"
        fields={invoiceFields}
        onFieldChange={handleFieldChange}
        onSubmit={handleCreate}
      />
    </div>
  );
}
