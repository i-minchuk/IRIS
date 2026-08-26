import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import SrmFormModal, { type SrmField } from '@/features/srm/components/SrmFormModal';
import { createPurchaseRequest, updatePurchaseRequest, type PurchaseRequestCreatePayload } from '@/features/srm/api/srmApi';
import { getProjects, type Project } from '@/features/projects/api/projects';
import type { PurchaseRequestStatus, PurchaseRequest } from '@/types/srm';
import { Calendar, User, ArrowRight, Plus } from 'lucide-react';

const STATUS_COLUMNS: { status: PurchaseRequestStatus; label: string }[] = [
  { status: 'draft', label: 'Черновик' },
  { status: 'submitted', label: 'Подано' },
  { status: 'manager_review', label: 'Менеджер' },
  { status: 'director_review', label: 'Директор' },
  { status: 'approved', label: 'Утверждено' },
  { status: 'rfq_sent', label: 'ЗК отправлен' },
  { status: 'quotation_received', label: 'Котировки' },
  { status: 'comparison', label: 'Сравнение' },
  { status: 'po_issued', label: 'Заказ' },
  { status: 'completed', label: 'Завершено' },
];

const PRIORITY_COLORS = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#6B7280',
};

export default function PurchaseRequestsPage() {
  const requests = useSRMStore(s => s.purchaseRequests);
  const fetchPurchaseRequests = useSRMStore(s => s.fetchPurchaseRequests);
  const user = useAuthStore(s => s.user);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    getProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const requestFields: SrmField[] = [
    { key: 'title', label: 'Название заявки', required: true, fullWidth: true },
    { key: 'description', label: 'Описание', type: 'textarea', fullWidth: true },
    {
      key: 'project_id', label: 'Проект', type: 'select', required: true,
      options: projects.map(p => ({ value: String(p.id), label: p.name })),
    },
    { key: 'requester', label: 'Инициатор', required: true, defaultValue: user?.full_name || user?.email || '' },
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
    {
      key: 'priority', label: 'Приоритет', type: 'select', required: true, defaultValue: 'medium',
      options: [
        { value: 'low', label: 'Низкий' },
        { value: 'medium', label: 'Средний' },
        { value: 'high', label: 'Высокий' },
        { value: 'critical', label: 'Критический' },
      ],
    },
    { key: 'deadline', label: 'Срок поставки', type: 'date' },
  ];

  const handleFieldChange = (key: string, value: string, setValue: (k: string, v: string) => void) => {
    if (key === 'project_id') {
      const project = projects.find(p => p.id === Number(value));
      setValue('project_name', project?.name ?? '');
    }
  };

  const handleCreate = async (values: Record<string, string>) => {
    const payload = {
      title: values.title.trim(),
      description: values.description?.trim() ?? '',
      project_id: Number(values.project_id),
      project_name: values.project_name ?? '',
      status: 'draft',
      requester: values.requester.trim(),
      amount: parseFloat(values.amount) || 0,
      currency: values.currency || 'RUB',
      priority: (values.priority || 'medium') as PurchaseRequest['priority'],
      ...(values.deadline ? { deadline: values.deadline } : {}),
    } as PurchaseRequestCreatePayload;
    await createPurchaseRequest(payload);
    await fetchPurchaseRequests();
    toast.success('Заявка создана');
  };

  useEffect(() => {
    fetchPurchaseRequests();
  }, [fetchPurchaseRequests]);

  const getRequestsForColumn = (status: PurchaseRequestStatus) =>
    requests.filter(r => r.status === status);

  // Перевод заявки на следующий этап маршрута (Черновик → Подано → … → Завершено)
  const moveToNext = async (request: PurchaseRequest) => {
    const currentIndex = STATUS_COLUMNS.findIndex(c => c.status === request.status);
    const next = STATUS_COLUMNS[currentIndex + 1];
    if (!next) return;
    try {
      await updatePurchaseRequest(request.id, { status: next.status });
      await fetchPurchaseRequests();
      toast.success(`Заявка #${request.id} перенесена: ${next.label}`);
    } catch {
      toast.error('Не удалось изменить статус заявки');
    }
  };

  const getNextColumn = (request: PurchaseRequest) => {
    const currentIndex = STATUS_COLUMNS.findIndex(c => c.status === request.status);
    return STATUS_COLUMNS[currentIndex + 1] ?? null;
  };

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Заявки на закупку</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Kanban-доска закупочного процесса</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer"
          style={{ background: '#2563EB', color: '#ffffff' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1d4ed8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB'; }}
        >
          <Plus size={13} /> Создать заявку
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUS_COLUMNS.map(column => {
          const columnRequests = getRequestsForColumn(column.status);
          return (
            <div key={column.status} className="flex-shrink-0 w-64">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
                  {column.label}
                </h3>
                <span className="text-base md:text-lg font-medium leading-relaxed mt-1 px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                  {columnRequests.length}
                </span>
              </div>

              <div className="space-y-2">
                {columnRequests.map(request => {
                  const nextColumn = getNextColumn(request);
                  return (
                  <Card
                    key={request.id}
                    padding="sm"
                    className="cursor-pointer transition-all"
                    style={{
                      borderLeftWidth: '3px',
                      borderLeftColor: PRIORITY_COLORS[request.priority],
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: PRIORITY_COLORS[request.priority] }}>
                        {request.priority === 'critical' ? 'Критический' : request.priority === 'high' ? 'Высокий' : request.priority === 'medium' ? 'Средний' : 'Низкий'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>#{request.id}</span>
                    </div>

                    <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                      {request.title}
                    </h4>

                    <p className="text-base md:text-lg font-medium leading-relaxed mt-1 line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>
                      {request.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span className="flex items-center gap-1">
                        <User size={10} /> {request.requester}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} /> {request.deadline}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {request.amount.toLocaleString('ru-RU')} {request.currency}
                      </span>
                      {nextColumn && (
                        <button
                          onClick={() => moveToNext(request)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-80 cursor-pointer"
                          style={{ color: 'var(--brand-iris)', backgroundColor: 'var(--bg-surface-2)' }}
                          title={`Перенести в «${nextColumn.label}»`}
                        >
                          <ArrowRight size={12} /> {nextColumn.label}
                        </button>
                      )}
                    </div>
                  </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <SrmFormModal
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        title="Новая заявка на закупку"
        submitLabel="Создать заявку"
        fields={requestFields}
        onFieldChange={handleFieldChange}
        onSubmit={handleCreate}
      />
    </div>
  );
}
