import { useState } from 'react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import { Search, Star, Building2, Phone, Mail, MapPin, Shield, CheckCircle2 } from 'lucide-react';
import type { SupplierStatus } from '@/types/srm';

const STATUS_CONFIG: Record<SupplierStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  draft: { label: 'Черновик', variant: 'neutral' },
  verification: { label: 'Проверка', variant: 'warning' },
  approved: { label: 'Утверждён', variant: 'info' },
  active: { label: 'Активен', variant: 'success' },
  suspended: { label: 'Приостановлен', variant: 'warning' },
  blacklisted: { label: 'Чёрный список', variant: 'error' },
  archived: { label: 'В архиве', variant: 'neutral' },
};

export default function SuppliersPage() {
  const suppliers = useSRMStore(s => s.suppliers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all');

  const filtered = suppliers.filter(s => {
    const matchesSearch = search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.inn.includes(search);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>Поставщики</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Реестр поставщиков и подрядчиков</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию или ИНН..." className="pl-9" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SupplierStatus | 'all')}
          className="h-10 px-3 rounded-lg text-sm border outline-none"
          style={{ backgroundColor: 'var(--bg-surface-2)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
        >
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
            <option key={status} value={status}>{cfg.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(supplier => (
          <Card key={supplier.id} padding="md" className="hover:opacity-90 transition-opacity cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={18} style={{ color: 'var(--brand-iris)' }} />
                <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{supplier.name}</h3>
              </div>
              <Badge variant={STATUS_CONFIG[supplier.status].variant}>{STATUS_CONFIG[supplier.status].label}</Badge>
            </div>

            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Shield size={12} /> ИНН: {supplier.inn}
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <MapPin size={12} /> {supplier.address}
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Phone size={12} /> {supplier.contact_phone}
              </div>
              <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={12} /> {supplier.contact_email}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    style={{ color: i < Math.floor(supplier.rating) ? '#F59E0B' : 'var(--text-tertiary)' }}
                    fill={i < Math.floor(supplier.rating) ? '#F59E0B' : 'none'}
                  />
                ))}
                <span className="text-base md:text-lg font-medium leading-relaxed mt-1 ml-1" style={{ color: 'var(--text-secondary)' }}>{supplier.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                {supplier.verified_by_legal && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                    <CheckCircle2 size={12} /> Юрист
                  </span>
                )}
                {supplier.verified_by_accountant && (
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--success)' }}>
                    <CheckCircle2 size={12} /> Бухгалтер
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
