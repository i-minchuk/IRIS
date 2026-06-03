import type { SupportTicket, TicketStatus } from '@/types/support';
import { Clock, AlertCircle, ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';
import type { ReactNode } from 'react';

const COLUMNS: { status: TicketStatus; label: string }[] = [
  { status: 'new', label: 'Новые' },
  { status: 'open', label: 'Открытые' },
  { status: 'in_progress', label: 'В работе' },
  { status: 'resolved', label: 'Решённые' },
  { status: 'closed', label: 'Закрытые' },
];

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; icon: ReactNode; label: string }> = {
  critical: {
    color: '#dc2626',
    bg: '#fef2f2',
    icon: <AlertCircle size={12} />,
    label: 'Критично',
  },
  high: {
    color: '#ea580c',
    bg: '#fff7ed',
    icon: <ArrowUpCircle size={12} />,
    label: 'Высокий',
  },
  medium: {
    color: '#d97706',
    bg: '#fffbeb',
    icon: <MinusCircle size={12} />,
    label: 'Средний',
  },
  low: {
    color: '#059669',
    bg: '#ecfdf5',
    icon: <ArrowDownCircle size={12} />,
    label: 'Низкий',
  },
};

interface TicketKanbanProps {
  tickets: SupportTicket[];
  onStatusChange: (ticketId: number, status: TicketStatus) => void;
}

function isOverdue(ticket: SupportTicket): boolean {
  if (ticket.status === 'resolved' || ticket.status === 'closed') return false;
  return new Date(ticket.sla_deadline) < new Date();
}

export function TicketKanban({ tickets, onStatusChange }: TicketKanbanProps) {
  const byColumn = COLUMNS.map((col) => ({
    ...col,
    items: tickets.filter((t) => t.status === col.status),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {byColumn.map((col) => (
        <div
          key={col.status}
          className="flex min-w-[16rem] flex-1 flex-col gap-3 rounded-xl border p-3"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {col.label}
            </span>
            <span
              className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                color: 'var(--text-secondary)',
              }}
            >
              {col.items.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {col.items.map((ticket) => {
              const pri = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
              const overdue = isOverdue(ticket);
              return (
                <button
                  key={ticket.id}
                  onClick={() => {
                    const nextIndex = COLUMNS.findIndex((c) => c.status === ticket.status) + 1;
                    if (nextIndex < COLUMNS.length) {
                      onStatusChange(ticket.id, COLUMNS[nextIndex].status);
                    }
                  }}
                  className="flex flex-col gap-2 rounded-lg border p-3 text-left transition-shadow hover:shadow-sm"
                  style={{
                    backgroundColor: 'var(--bg-surface-2)',
                    borderColor: 'var(--border-default)',
                    borderLeft: `3px solid ${pri.color}`,
                  }}
                >
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {ticket.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: pri.bg, color: pri.color }}
                    >
                      {pri.icon}
                      {pri.label}
                    </span>
                    {overdue && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                        }}
                      >
                        <Clock size={10} />
                        SLA просрочен
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{ticket.requester}</span>
                    <span>{new Date(ticket.sla_deadline).toLocaleDateString('ru-RU')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
