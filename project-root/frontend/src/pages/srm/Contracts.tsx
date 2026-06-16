import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import type { ContractStatus } from '@/types/srm';
import { FileText, Calendar, Building2, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

const STATUS_CONFIG: Record<ContractStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  draft: { label: 'Черновик', variant: 'neutral' },
  legal_review: { label: 'Юр. проверка', variant: 'warning' },
  negotiation: { label: 'Переговоры', variant: 'info' },
  approved: { label: 'Утверждён', variant: 'success' },
  signed: { label: 'Подписан', variant: 'success' },
  active: { label: 'Активен', variant: 'success' },
  completed: { label: 'Завершён', variant: 'neutral' },
  terminated: { label: 'Расторгнут', variant: 'error' },
};

export default function ContractsPage() {
  const contracts = useSRMStore(s => s.contracts);

  // Use useMemo to avoid recalculating on every render
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const legalReviewCount = contracts.filter(c => c.status === 'legal_review').length;
    const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0);
    return { totalContracts, activeContracts, legalReviewCount, totalAmount };
  }, [contracts]);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Договоры</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Реестр договоров с поставщиками</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <FileText size={18} style={{ color: 'var(--brand-iris)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{stats.totalContracts}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Всего договоров</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, var(--bg-surface))' }}>
            <TrendingUp size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>{stats.activeContracts}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Активных</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))' }}>
            <Calendar size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>
              {stats.legalReviewCount}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>На проверке</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--brand-iris) 10%, var(--bg-surface))' }}>
            <Building2 size={18} style={{ color: 'var(--brand-iris)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--brand-iris)' }}>
              {(stats.totalAmount / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Общая сумма</div>
          </div>
        </Card>
      </div>

      <div className="space-y-3">
        {contracts.map(contract => (
          <Card key={contract.id} padding="md" className="hover:opacity-90 transition-opacity cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {contract.number}
                  </span>
                  <Badge variant={STATUS_CONFIG[contract.status].variant}>
                    {STATUS_CONFIG[contract.status].label}
                  </Badge>
                </div>
                <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{contract.title}</h3>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <Building2 size={12} /> {contract.supplier_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {contract.start_date} — {contract.end_date}
                  </span>
                  <span>Проект: {contract.project_name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {contract.amount.toLocaleString('ru-RU')} {contract.currency}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
