import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useSupportStore } from '@/stores/supportStore';
import { TicketKanban } from '@/components/admin/TicketKanban';
import { Ticket, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SupportTicketsPage() {
  const tickets = useSupportStore(s => s.tickets);
  const updateTicketStatus = useSupportStore(s => s.updateTicketStatus);
  const openTickets = useSupportStore(s => s.getOpenTickets());
  const slaCompliance = useSupportStore(s => s.getSLACompliance());

  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved' && t.status !== 'closed').length;

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>
            Тикеты поддержки
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Управление обращениями пользователей
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
            <Ticket size={18} style={{ color: 'var(--brand-iris)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tickets.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Всего тикетов</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--warning) 10%, var(--bg-surface))' }}>
            <Clock size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>{openTickets.length}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Открытые</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, var(--bg-surface))' }}>
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--error)' }}>{criticalCount}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Критических</div>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, var(--bg-surface))' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
          </div>
          <div>
            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>{resolvedCount}</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Решённые</div>
          </div>
        </Card>
      </div>

      {/* SLA */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>SLA Compliance</h3>
          <Badge variant={slaCompliance >= 90 ? 'success' : slaCompliance >= 70 ? 'warning' : 'error'}>
            {slaCompliance}%
          </Badge>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${slaCompliance}%`,
              backgroundColor: slaCompliance >= 90 ? 'var(--success)' : slaCompliance >= 70 ? 'var(--warning)' : 'var(--error)',
            }}
          />
        </div>
      </Card>

      {/* Kanban */}
      <Card padding="md">
        <TicketKanban tickets={tickets} onStatusChange={updateTicketStatus} />
      </Card>
    </div>
  );
}
