import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import SrmFormModal from '@/features/srm/components/SrmFormModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { SUPPLIER_FIELDS as supplierFields, buildSupplierPayload } from '@/features/srm/components/supplierForm';
import { createSupplier, updateSupplier, deleteSupplier, createCustomer, updateCustomer, deleteCustomer, type SupplierCreatePayload } from '@/features/srm/api/srmApi';
import { Search, Star, Building2, Phone, Mail, MapPin, Shield, CheckCircle2, Plus, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import type { Supplier, SupplierStatus } from '@/types/srm';

const STATUS_CONFIG: Record<SupplierStatus, { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
  draft: { label: 'Черновик', variant: 'neutral' },
  verification: { label: 'Проверка', variant: 'warning' },
  approved: { label: 'Утверждён', variant: 'info' },
  active: { label: 'Активен', variant: 'success' },
  suspended: { label: 'Приостановлен', variant: 'warning' },
  blacklisted: { label: 'Чёрный список', variant: 'error' },
  archived: { label: 'В архиве', variant: 'neutral' },
};

interface SuppliersPageProps {
  /** 'customer' — режим «Заказчики» (вкладка Тендеры), хранилище srm_customers */
  variant?: 'supplier' | 'customer';
}

export default function SuppliersPage({ variant = 'supplier' }: SuppliersPageProps) {
  const isCustomer = variant === 'customer';
  const suppliers = useSRMStore(s => s.suppliers);
  const customers = useSRMStore(s => s.customers);
  const fetchSuppliers = useSRMStore(s => s.fetchSuppliers);
  const fetchCustomers = useSRMStore(s => s.fetchCustomers);
  // Источник данных и API зависят от режима: поставщики и заказчики — разные хранилища
  const entities = isCustomer ? customers : suppliers;
  const fetchEntities = isCustomer ? fetchCustomers : fetchSuppliers;
  const createEntity = isCustomer ? createCustomer : createSupplier;
  const updateEntity = isCustomer ? updateCustomer : updateSupplier;
  const deleteEntity = isCustomer ? deleteCustomer : deleteSupplier;
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all');
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [statusMenuFor, setStatusMenuFor] = useState<number | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (supplierId: number, status: SupplierStatus) => {
    setStatusMenuFor(null);
    try {
      await updateEntity(supplierId, { status });
      await fetchEntities();
      toast.success('Статус обновлён');
    } catch {
      toast.error('Не удалось обновить статус');
    }
  };

  const handleCreate = async (values: Record<string, string>) => {
    const payload: SupplierCreatePayload = {
      ...buildSupplierPayload(values),
      status: 'draft',
      rating: 0,
      verified_by_legal: false,
      verified_by_accountant: false,
    } as SupplierCreatePayload;
    await createEntity(payload);
    await fetchEntities();
    toast.success(isCustomer ? 'Заказчик создан' : 'Поставщик создан');
  };

  const handleEdit = async (values: Record<string, string>) => {
    if (!editingSupplier) return;
    await updateEntity(editingSupplier.id, buildSupplierPayload(values));
    await fetchEntities();
    toast.success(isCustomer ? 'Заказчик обновлён' : 'Поставщик обновлён');
  };

  const handleDelete = async () => {
    if (!deletingSupplier || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteEntity(deletingSupplier.id);
      await fetchEntities();
      toast.success(isCustomer ? 'Заказчик удалён' : 'Поставщик удалён');
      setDeletingSupplier(null);
    } catch {
      toast.error('Не удалось удалить — возможно, есть связанные договоры');
    } finally {
      setIsDeleting(false);
    }
  };

  const editFields = editingSupplier
    ? supplierFields.map(f => ({
        ...f,
        defaultValue: String(editingSupplier[f.key as keyof Supplier] ?? ''),
      }))
    : supplierFields;

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const filtered = entities.filter(s => {
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
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>{isCustomer ? 'Заказчики' : 'Поставщики'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isCustomer ? 'Реестр заказчиков' : 'Реестр поставщиков и подрядчиков'}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: '#2563EB', color: '#ffffff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
        >
          <Plus size={13} /> {isCustomer ? 'Создать заказчика' : 'Создать поставщика'}
        </button>
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
              <div className="relative">
                <button
                  onClick={() => setStatusMenuFor(statusMenuFor === supplier.id ? null : supplier.id)}
                  className="flex items-center gap-1 cursor-pointer"
                  title="Изменить статус"
                >
                  <Badge variant={STATUS_CONFIG[supplier.status].variant}>{STATUS_CONFIG[supplier.status].label}</Badge>
                  <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />
                </button>
                {statusMenuFor === supplier.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStatusMenuFor(null)} />
                    <div
                      className="absolute right-0 top-full mt-1 z-20 min-w-[170px] rounded-lg border py-1 shadow-lg"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
                    >
                      {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(supplier.id, status as SupplierStatus)}
                          className="w-full text-left px-3 py-1.5 transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: status === supplier.status ? 'var(--bg-surface-2)' : 'transparent',
                          }}
                        >
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
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
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => setEditingSupplier(supplier)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--brand-iris)', backgroundColor: 'var(--bg-surface-2)' }}
                    title="Редактировать"
                  >
                    <Pencil size={12} /> Редактировать
                  </button>
                  <button
                    onClick={() => setDeletingSupplier(supplier)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                    style={{ color: 'var(--error)', backgroundColor: 'color-mix(in srgb, var(--error) 8%, var(--bg-surface-2))' }}
                    title="Удалить"
                  >
                    <Trash2 size={12} /> Удалить
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SrmFormModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title={isCustomer ? 'Новый заказчик' : 'Новый поставщик'}
        submitLabel={isCustomer ? 'Создать заказчика' : 'Создать поставщика'}
        fields={supplierFields}
        onSubmit={handleCreate}
      />

      <SrmFormModal
        isOpen={editingSupplier !== null}
        onClose={() => setEditingSupplier(null)}
        title={isCustomer ? 'Редактировать заказчика' : 'Редактировать поставщика'}
        submitLabel="Сохранить"
        fields={editFields}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        isOpen={deletingSupplier !== null}
        title="Подтвердите действие"
        message={deletingSupplier ? `Удалить ${isCustomer ? 'заказчика' : 'поставщика'} «${deletingSupplier.name}»?\nДействие необратимо.` : ''}
        confirmLabel="Удалить"
        danger
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingSupplier(null)}
      />
    </div>
  );
}
