import { useState } from 'react';
import { Card } from '@/components/ui';
import { useSRMStore } from '@/stores/srmStore';
import type { PurchaseRequestStatus, PurchaseRequest } from '@/types/srm';
import { Calendar, User, ArrowRight } from 'lucide-react';

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
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const getRequestsForColumn = (status: PurchaseRequestStatus) =>
    requests.filter(r => r.status === status);

  const moveToNext = (request: PurchaseRequest) => {
    const currentIndex = STATUS_COLUMNS.findIndex(c => c.status === request.status);
    const nextStatus = STATUS_COLUMNS[currentIndex + 1]?.status;
    if (nextStatus) {
      // In real app, this would call an API
      console.log(`Moving ${request.id} to ${nextStatus}`);
    }
  };

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div>
        <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>Заявки на закупку</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Kanban-доска закупочного процесса</p>
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
                {columnRequests.map(request => (
                  <Card
                    key={request.id}
                    padding="sm"
                    className="cursor-pointer transition-all"
                    style={{
                      borderLeftWidth: '3px',
                      borderLeftColor: PRIORITY_COLORS[request.priority],
                    }}
                    onMouseEnter={() => setHoveredCard(request.id)}
                    onMouseLeave={() => setHoveredCard(null)}
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
                      {hoveredCard === request.id && (
                        <button
                          onClick={() => moveToNext(request)}
                          className="p-1 rounded transition-colors"
                          style={{ backgroundColor: 'var(--bg-surface-2)' }}
                        >
                          <ArrowRight size={14} style={{ color: 'var(--brand-iris)' }} />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
