import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import SrmFormModal, { type SrmField } from '@/features/srm/components/SrmFormModal';
import { createContract, updateContract, uploadContractAttachment, downloadContractAttachment, type ContractCreatePayload, type ContractUpdatePayload } from '@/features/srm/api/srmApi';
import { getProjects, type Project } from '@/features/projects/api/projects';
import type { Contract, ContractStatus } from '@/types/srm';
import { FileText, Calendar, Building2, TrendingUp, Plus, Send, Paperclip, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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

/** Маршрут движения договора: какой статус следующий и как называется действие. */
const NEXT_ACTION: Partial<Record<ContractStatus, { next: ContractStatus; label: string }>> = {
  draft: { next: 'legal_review', label: 'Отправить на проверку' },
  legal_review: { next: 'negotiation', label: 'На переговоры' },
  negotiation: { next: 'approved', label: 'Утвердить' },
  approved: { next: 'signed', label: 'Подписать' },
  signed: { next: 'active', label: 'Активировать' },
  active: { next: 'completed', label: 'Завершить' },
};

/** ISO-дата из API → ДД.ММ.ГГГГ */
function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ru-RU');
}

export default function ContractsPage() {
  const contracts = useSRMStore(s => s.contracts);
  const fetchContracts = useSRMStore(s => s.fetchContracts);
  const customers = useSRMStore(s => s.customers);
  const fetchCustomers = useSRMStore(s => s.fetchCustomers);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetchContracts();
    fetchCustomers();
    getProjects().then(setProjects).catch(() => setProjects([]));
  }, [fetchContracts, fetchCustomers]);

  // Автоматическая нумерация договоров в пределах текущего года: СТ-ДГ-ГГГГ-NNN
  const nextContractNumber = useMemo(() => {
    const year = new Date().getFullYear();
    const maxSeq = contracts.reduce((max, c) => {
      const m = c.number.match(/^СТ-ДГ-(\d{4})-(\d+)$/);
      return m && Number(m[1]) === year ? Math.max(max, Number(m[2])) : max;
    }, 0);
    return `СТ-ДГ-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
  }, [contracts]);

  const contractFields: SrmField[] = [
    { key: 'number', label: 'Номер договора', required: true, defaultValue: nextContractNumber, readOnly: true },
    { key: 'title', label: 'Название', required: true },
    {
      key: 'supplier_id', label: 'Заказчик', type: 'select', required: true,
      options: customers.map(c => ({ value: String(c.id), label: c.name })),
    },
    { key: 'amount', label: 'Сумма', type: 'number', required: true, placeholder: '0' },
    {
      key: 'currency', label: 'Валюта', type: 'select', defaultValue: 'RUB',
      options: [
        { value: 'RUB', label: 'RUB' },
        { value: 'USD', label: 'USD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'CNY', label: 'CNY' },
      ],
    },
    {
      key: 'project_id', label: 'Проект', type: 'select', required: true,
      options: projects.map(p => ({ value: String(p.id), label: p.name })),
    },
    { key: 'start_date', label: 'Дата начала', type: 'date' },
    { key: 'end_date', label: 'Дата окончания', type: 'date', required: true },
    { key: 'attachment', label: 'Файл договора', type: 'file' },
  ];

  const handleFieldChange = (key: string, value: string, setValue: (k: string, v: string) => void) => {
    if (key === 'supplier_id') {
      const customer = customers.find(c => c.id === Number(value));
      setValue('supplier_name', customer?.name ?? '');
    }
    if (key === 'project_id') {
      const project = projects.find(p => p.id === Number(value));
      setValue('project_name', project?.name ?? '');
      // Автоподстановка названия договора из названия проекта
      setValue('title', project?.name ?? '');
      // Заказчик подтягивается из тендера (customer_name проекта, скопированный из тендера)
      if (project?.customer_name) {
        const normalize = (s: string) => s.toLowerCase().replace(/[«»"'`\s]/g, '');
        const customerName = normalize(project.customer_name);
        const match = customers.find(c => normalize(c.name) === customerName);
        if (match) {
          setValue('supplier_id', String(match.id));
          setValue('supplier_name', match.name);
        }
      }
    }
  };

  const handleCreate = async (values: Record<string, string>, files: Record<string, File>) => {
    let attachment: { attachment_name: string; attachment_stored: string } | null = null;
    if (files.attachment) {
      const uploaded = await uploadContractAttachment(files.attachment);
      attachment = { attachment_name: uploaded.file_name, attachment_stored: uploaded.stored_name };
    }
    const payload = {
      number: values.number.trim(),
      title: values.title.trim(),
      supplier_id: Number(values.supplier_id),
      supplier_name: values.supplier_name ?? '',
      status: 'draft',
      amount: parseFloat(values.amount) || 0,
      currency: values.currency || 'RUB',
      project_id: Number(values.project_id),
      project_name: values.project_name ?? '',
      ...(values.start_date ? { start_date: values.start_date } : {}),
      ...(values.end_date ? { end_date: values.end_date } : {}),
      ...(attachment ?? {}),
    } as ContractCreatePayload;
    await createContract(payload);
    await fetchContracts();
    toast.success('Договор создан');
  };

  const handleEdit = async (values: Record<string, string>, files: Record<string, File>) => {
    if (!editingContract) return;
    let attachment: { attachment_name: string; attachment_stored: string } | null = null;
    if (files.attachment) {
      const uploaded = await uploadContractAttachment(files.attachment);
      attachment = { attachment_name: uploaded.file_name, attachment_stored: uploaded.stored_name };
    }
    const payload: ContractUpdatePayload = {
      number: values.number.trim(),
      title: values.title.trim(),
      supplier_id: Number(values.supplier_id),
      supplier_name: values.supplier_name ?? '',
      amount: parseFloat(values.amount) || 0,
      currency: values.currency || 'RUB',
      project_id: Number(values.project_id),
      project_name: values.project_name ?? '',
      ...(values.start_date ? { start_date: values.start_date } : {}),
      ...(values.end_date ? { end_date: values.end_date } : {}),
      ...(attachment ?? {}),
    };
    await updateContract(editingContract.id, payload);
    await fetchContracts();
    toast.success('Договор обновлён');
  };

  // Поля формы редактирования: подставляем текущие значения договора
  const editFields: SrmField[] = editingContract
    ? contractFields.map((f) => {
        if (f.type === 'file') return f;
        const raw = editingContract[f.key as keyof Contract];
        let v = raw == null ? '' : String(raw);
        if (f.type === 'date' && v) v = v.slice(0, 10);
        return { ...f, defaultValue: v };
      })
    : contractFields;

  // Перевод договора на следующий шаг маршрута (Черновик → Юр. проверка → … → Завершён)
  const handleAdvance = async (contract: Contract) => {
    const action = NEXT_ACTION[contract.status];
    if (!action) return;
    try {
      await updateContract(contract.id, { status: action.next });
      await fetchContracts();
      toast.success(`Договор ${contract.number}: ${STATUS_CONFIG[action.next].label}`);
    } catch {
      toast.error('Не удалось изменить статус договора');
    }
  };

  // Use useMemo to avoid recalculating on every render
  const stats = useMemo(() => {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const legalReviewCount = contracts.filter(c => c.status === 'legal_review').length;
    const totalAmount = contracts.reduce((sum, c) => sum + c.amount, 0);
    return { totalContracts, activeContracts, legalReviewCount, totalAmount };
  }, [contracts]);

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Договоры</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Реестр договоров с заказчиками</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            style={{ background: '#2563EB', color: '#ffffff' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
          >
            <Plus size={13} /> Создать договор
          </button>
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
                  {NEXT_ACTION[contract.status] && (
                    <button
                      onClick={() => handleAdvance(contract)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ color: 'var(--brand-iris)', backgroundColor: 'var(--bg-surface-2)' }}
                    >
                      <Send size={11} /> {NEXT_ACTION[contract.status]!.label}
                    </button>
                  )}
                </div>
                <h3 className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{contract.title}</h3>
                <div className="flex items-center gap-4 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <Building2 size={12} /> {contract.supplier_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(contract.start_date)} — {formatDate(contract.end_date)}
                  </span>
                  <span>Проект: {contract.project_name}</span>
                  {contract.attachment_name && contract.attachment_stored && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadContractAttachment(contract.attachment_stored!, contract.attachment_name!);
                      }}
                      className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80 cursor-pointer"
                      style={{ color: 'var(--brand-iris)' }}
                      title="Скачать файл договора"
                    >
                      <Paperclip size={12} /> {contract.attachment_name}
                    </button>
                  )}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {contract.amount.toLocaleString('ru-RU')} {contract.currency}
                </div>
                <button
                  onClick={() => setEditingContract(contract)}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                  style={{ color: 'var(--brand-iris)', backgroundColor: 'var(--bg-surface-2)' }}
                  title="Редактировать"
                >
                  <Pencil size={12} /> Редактировать
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SrmFormModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title="Новый договор"
        submitLabel="Создать договор"
        fields={contractFields}
        onFieldChange={handleFieldChange}
        onSubmit={handleCreate}
      />

      <SrmFormModal
        isOpen={editingContract !== null}
        onClose={() => setEditingContract(null)}
        title="Редактировать договор"
        submitLabel="Сохранить"
        fields={editFields}
        onFieldChange={handleFieldChange}
        onSubmit={handleEdit}
      />
    </div>
  );
}
