import { useEffect, useMemo, useState } from 'react';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageTabs } from '@/shared/components/PageTabs';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useAuditStore } from '@/stores/auditStore';
import { useSupportStore } from '@/stores/supportStore';
import { useReleaseStore } from '@/stores/releaseStore';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import SessionList from '@/features/time_tracking/components/SessionList';
import AnalyticsPanel from '@/features/time_tracking/components/AnalyticsPanel';
import { adminApi, type AdminUser } from '@/features/auth/api/adminApi';
import {
  Users, Shield, Ticket, AlertTriangle, LayoutDashboard, Timer,
} from 'lucide-react';

type AdminTab = 'overview' | 'time';

const TAB_COLOR = '#FF6B6B';

const TABS = [
  { key: 'overview' as AdminTab, label: 'Обзор', icon: <LayoutDashboard size={16} />, color: TAB_COLOR },
  { key: 'time' as AdminTab, label: 'Учёт времени', icon: <Timer size={16} />, color: TAB_COLOR },
];

/* ═══════════════════════════════════════════════════════════
   DASHBOARD OVERVIEW TAB
   ═══════════════════════════════════════════════════════════ */
function DashboardOverview() {
  const auditEntries = useAuditStore(s => s.entries);
  const fetchAuditEntries = useAuditStore(s => s.fetchEntries);
  const tickets = useSupportStore(s => s.tickets);
  const incidents = useSupportStore(s => s.incidents);
  const releases = useReleaseStore(s => s.releases);
  const fetchTickets = useSupportStore(s => s.fetchTickets);
  const fetchIncidents = useSupportStore(s => s.fetchIncidents);
  const fetchReleases = useReleaseStore(s => s.fetchReleases);
  const [users, setUsers] = useState<AdminUser[] | null>(null);

  useEffect(() => {
    fetchAuditEntries();
    fetchTickets();
    fetchIncidents();
    fetchReleases();
    adminApi.getUsers().then(setUsers).catch(() => setUsers([]));
  }, [fetchAuditEntries, fetchTickets, fetchIncidents, fetchReleases]);

  const usersCount = users === null ? '…' : String(users.length);
  const rolesCount = users === null ? '…' : String(new Set(users.map(u => u.role)).size);

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
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={18} />} label="Пользователей" value={usersCount} color="#3B82F6" />
        <StatCard icon={<Shield size={18} />} label="Ролей" value={rolesCount} color="#8B5CF6" />
        <StatCard icon={<Ticket size={18} />} label="Открытых тикетов" value={String(openTickets.length)} color="#F59E0B" />
        <StatCard icon={<AlertTriangle size={18} />} label="Инцидентов" value={String(openIncidents.length)} color="#EF4444" />
      </div>

      {/* Audit + Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Аудит</h3>
            <div className="flex items-center gap-2">
              <Badge variant="error">{auditStats.critical} крит</Badge>
              <Badge variant="warning">{auditStats.warning} варн</Badge>
            </div>
          </div>
          <AuditLogTable entries={recentAudit} />
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Поддержка</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>SLA:</span>
              <Badge variant={slaCompliance >= 90 ? 'success' : slaCompliance >= 70 ? 'warning' : 'error'}>
                {slaCompliance}%
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            {/* Ticket priority bars */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Приоритеты тикетов</p>
              <div className="space-y-1.5">
                {ticketPriorityData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--iris-bg-hover)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / maxTicket) * 100}%`, background: d.color }} />
                    </div>
                    <span className="text-xs font-bold w-6 text-right" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident severity bars */}
            <div>
              <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Инциденты по severity</p>
              <div className="space-y-1.5">
                {incidentSeverityData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-xs w-20 shrink-0" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--iris-bg-hover)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / maxIncident) * 100}%`, background: d.color }} />
                    </div>
                    <span className="text-xs font-bold w-6 text-right" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Releases */}
      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Релизы</h3>
          <div className="flex items-center gap-2">
            <Badge variant="success" >{readyReleases} готовы</Badge>
            <Badge variant="info" >{releases.length - readyReleases} в работе</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {releases.slice(0, 3).map(r => (
            <div key={r.id} className="rounded-lg p-3 border" style={{ background: 'var(--iris-bg-hover)', borderColor: 'var(--iris-border-subtle)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{r.version}</span>
                <Badge variant={r.status === 'ready' ? 'success' : r.status === 'testing' ? 'warning' : 'info'}>
                  {r.status === 'ready' ? 'Готов' : r.status === 'testing' ? 'Тестирование' : 'Разработка'}
                </Badge>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.name}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useTabState<AdminTab>('iris_admin_tab', 'overview');

  return (
    <div className="w-full pt-2 pb-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Администрирование</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Управление системой, аудит, учёт времени
          </p>
        </div>
      </div>


      <PageTabs tabs={TABS} active={activeTab} onChange={setActiveTab} color={TAB_COLOR} />

      {activeTab === 'overview' && <DashboardOverview />}
      {activeTab === 'time' && (
        <div className="space-y-6">
          <AnalyticsPanel />
          <SessionList />
        </div>
      )}
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
