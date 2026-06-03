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
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#3B82F6', '#F59E0B', '#EF4444'];

export default function AdminDashboard() {
  const auditStats = useAuditStore(s => s.getStats());
  const openTickets = useSupportStore(s => s.getOpenTickets());
  const openIncidents = useSupportStore(s => s.getOpenIncidents());
  const slaCompliance = useSupportStore(s => s.getSLACompliance());
  const recentAudit = useAuditStore(s => s.getRecentEntries(5));
  const releases = useReleaseStore(s => s.releases);

  const ticketPriorityData = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    openTickets.forEach(t => counts[t.priority]++);
    return [
      { name: 'Критический', value: counts.critical },
      { name: 'Высокий', value: counts.high },
      { name: 'Средний', value: counts.medium },
      { name: 'Низкий', value: counts.low },
    ].filter(d => d.value > 0);
  }, [openTickets]);

  const incidentSeverityData = useMemo(() => {
    const counts = { p1_critical: 0, p2_major: 0, p3_minor: 0, p4_info: 0 };
    openIncidents.forEach(i => counts[i.severity]++);
    return [
      { name: 'P1', value: counts.p1_critical },
      { name: 'P2', value: counts.p2_major },
      { name: 'P3', value: counts.p3_minor },
      { name: 'P4', value: counts.p4_info },
    ].filter(d => d.value > 0);
  }, [openIncidents]);

  const readyReleases = releases.filter(r => r.status === 'ready').length;

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:py-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            Тикеты по приоритету
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketPriorityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="var(--brand-iris)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
            Инциденты по severity
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentSeverityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {incidentSeverityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
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
