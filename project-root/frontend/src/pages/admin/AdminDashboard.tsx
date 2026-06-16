import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useAuditStore } from '@/stores/auditStore';
import { useSupportStore } from '@/stores/supportStore';
import { useReleaseStore } from '@/stores/releaseStore';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import {
  Users, Shield, Ticket, AlertTriangle, Activity, Server,
  Clock
} from 'lucide-react';


export default function AdminDashboard() {
  // Берём данные напрямую, не через методы-геттеры (избегаем infinite loop Zustand)
  const auditEntries = useAuditStore(s => s.entries);
  const tickets = useSupportStore(s => s.tickets);
  const incidents = useSupportStore(s => s.incidents);
  const releases = useReleaseStore(s => s.releases);

  const auditStats = useMemo(() => ({
    total: auditEntries.length,
    critical: auditEntries.filter(e => e.severity === 'critical').length,
    warning: auditEntries.filter(e => e.severity === 'warning').length,
    info: auditEntries.filter(e => e.severity === 'info').length,
  }), [auditEntries]);

  const openTickets = useMemo(() =>
    tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)),
  [tickets]);

  const openIncidents = useMemo(() =>
    incidents.filter(i => ['detected', 'investigating', 'mitigated'].includes(i.status)),
  [incidents]);

  const slaCompliance = useMemo(() => {
    const resolved = tickets.filter(t => t.resolved_at);
    if (resolved.length === 0) return 100;
    const compliant = resolved.filter(t => {
      const r = new Date(t.resolved_at!).getTime();
      const d = new Date(t.sla_deadline).getTime();
      return r <= d;
    }).length;
    return Math.round((compliant / resolved.length) * 100);
  }, [tickets]);

  const recentAudit = useMemo(() => auditEntries.slice(0, 5), [auditEntries]);

  const ticketPriorityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    openTickets.forEach(t => counts[t.priority]++);
    return [
      { name: 'Критический', value: counts.critical, color: '#EF4444' },
      { name: 'Высокий', value: counts.high, color: '#F59E0B' },
      { name: 'Средний', value: counts.medium, color: '#3B82F6' },
      { name: 'Низкий', value: counts.low, color: '#10B981' },
    ].filter(d => d.value > 0);
  }, [openTickets]);

  const incidentSeverityData = useMemo(() => {
    const counts = { p1_critical: 0, p2_major: 0, p3_minor: 0, p4_info: 0 };
    openIncidents.forEach(i => counts[i.severity]++);
    return [
      { name: 'P1', value: counts.p1_critical, color: '#EF4444' },
      { name: 'P2', value: counts.p2_major, color: '#F59E0B' },
      { name: 'P3', value: counts.p3_minor, color: '#3B82F6' },
      { name: 'P4', value: counts.p4_info, color: '#10B981' },
    ].filter(d => d.value > 0);
  }, [openIncidents]);

  const readyReleases = useMemo(() => releases.filter(r => r.status === 'ready').length, [releases]);

  const maxTicket = ticketPriorityData.reduce((m, d) => Math.max(m, d.value), 0) || 1;
  const maxIncident = incidentSeverityData.reduce((m, d) => Math.max(m, d.value), 0) || 1;

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div>
        <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>
          Панель администратора
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Сводная информация о состоянии системы
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={<Users size={20} />} label="Активные пользователи" value="24" color="#3B82F6" />
        <StatCard icon={<Shield size={20} />} label="MFA Adoption" value="68%" color="#10B981" />
        <StatCard icon={<Ticket size={20} />} label="Открытые тикеты" value={String(openTickets.length)} color="#F59E0B" />
        <StatCard icon={<AlertTriangle size={20} />} label="Открытые инциденты" value={String(openIncidents.length)} color="#EF4444" />
        <StatCard icon={<Activity size={20} />} label="SLA Compliance" value={`${slaCompliance}%`} color="#8B5CF6" />
        <StatCard icon={<Server size={20} />} label="Uptime" value="99.9%" color="#14B8A6" />
      </div>

      {/* Charts Row — HTML/CSS instead of recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            Тикеты по приоритету
          </h3>
          <div className="h-48 flex flex-col justify-center gap-3">
            {ticketPriorityData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Нет данных
              </div>
            ) : (
              ticketPriorityData.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-base md:text-lg font-medium leading-relaxed mt-1 w-20 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${(d.value / maxTicket) * 100}%`,
                        backgroundColor: d.color + '33',
                        borderRight: `3px solid ${d.color}`,
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            Инциденты по severity
          </h3>
          <div className="h-48 flex flex-col justify-center gap-3">
            {incidentSeverityData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Нет данных
              </div>
            ) : (
              incidentSeverityData.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-base md:text-lg font-medium leading-relaxed mt-1 w-10 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                  <div className="flex-1 h-6 rounded-md overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${(d.value / maxIncident) * 100}%`,
                        backgroundColor: d.color + '33',
                        borderRight: `3px solid ${d.color}`,
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: d.color }}>{d.value}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* SLA & Releases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card padding="md">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>SLA Compliance</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${slaCompliance}%`,
                    backgroundColor: slaCompliance >= 90 ? 'var(--success)' : slaCompliance >= 70 ? 'var(--warning)' : 'var(--error)',
                  }}
                />
              </div>
            </div>
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{slaCompliance}%</span>
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Целевой показатель: 95%
          </p>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Релизы готовы к деплою</h3>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold" style={{ color: 'var(--brand-iris)' }}>{readyReleases}</div>
            <div>
              <Badge variant="success">{releases.filter(r => r.status === 'deployed').length} развёрнуто</Badge>
              {releases.filter(r => r.status === 'rolled_back').length > 0 && (
                <Badge variant="error" className="ml-2">
                  {releases.filter(r => r.status === 'rolled_back').length} откат
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Аудит (последние 24ч)</h3>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{auditStats.total}</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Всего</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: 'var(--error)' }}>{auditStats.critical}</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Критических</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>{auditStats.warning}</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Предупреждений</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Audit */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Последние записи аудита
          </h3>
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <Clock size={12} /> Обновлено: {new Date().toLocaleTimeString('ru-RU')}
          </span>
        </div>
        <AuditLogTable entries={recentAudit} />
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}18`, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{label}</div>
      </div>
    </Card>
  );
}
