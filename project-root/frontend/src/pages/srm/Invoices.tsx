import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import type { InvoiceStatus } from '@/types/srm';
import { FileText, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  received: { label: 'Получен', variant: 'neutral' },
  verified: { label: 'Проверен', variant: 'info' },
  approved: { label: 'Утверждён', variant: 'success' },
  paid: { label: 'Оплачен', variant: 'success' },
  overdue: { label: 'Просрочен', variant: 'error' },
  cancelled: { label: 'Отменён', variant: 'error' },
};

export default function InvoicesPage() {
  const invoices = useSRMStore(s => s.invoices);

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

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Счета и платежи</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Управление счетами к оплате</p>
        </div>
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

      <div className="space-y-3">
        {invoices.map(invoice => (
          <Card key={invoice.id} padding="md" className="hover:opacity-90 transition-opacity cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: 'var(--brand-iris)' }} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{invoice.number}</span>
                    <Badge variant={STATUS_CONFIG[invoice.status].variant}>
                      {STATUS_CONFIG[invoice.status].label}
                    </Badge>
                  </div>
                  <div className="text-base md:text-lg font-medium leading-relaxed mt-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {invoice.supplier_name} • Выставлен: {invoice.issue_date} • Оплата до: {invoice.due_date}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {invoice.amount.toLocaleString('ru-RU')} {invoice.currency}
                </div>
                {invoice.paid_date && (
                  <div className="text-xs" style={{ color: 'var(--success)' }}>Оплачен: {invoice.paid_date}</div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
