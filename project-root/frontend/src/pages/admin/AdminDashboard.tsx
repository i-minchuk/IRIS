import { useEffect, useMemo, useState } from 'react';
import { useTabState } from '@/shared/hooks/useTabState';
import { PageTabs } from '@/shared/components/PageTabs';
import { Card } from '@/components/ui';
import { Badge } from '@/components/ui';
import { useAuditStore } from '@/stores/auditStore';
import { useSupportStore } from '@/stores/supportStore';
import { useReleaseStore } from '@/stores/releaseStore';
import { toast } from 'sonner';
import { AuditLogTable } from '@/components/admin/AuditLogTable';
import { TicketKanban } from '@/components/admin/TicketKanban';
import SessionList from '@/features/time_tracking/components/SessionList';
import AnalyticsPanel from '@/features/time_tracking/components/AnalyticsPanel';
import { adminApi, type AdminUser } from '@/features/auth/api/adminApi';
import RegistrationTab from './Registration';
import type { TicketStatus } from '@/types/support';
import {
  Users, Shield, Ticket, AlertTriangle, LayoutDashboard, Timer, UserPlus, Sparkles, KeyRound, Loader2,
  MessageSquareWarning, CheckCircle2, CircleDot, Archive, ArchiveRestore,
} from 'lucide-react';

type AdminTab = 'overview' | 'time' | 'registration' | 'support';

const TAB_COLOR = '#FF6B6B';

const TABS = [
  { key: 'overview' as AdminTab, label: 'Обзор', icon: <LayoutDashboard size={16} />, color: TAB_COLOR },
  { key: 'time' as AdminTab, label: 'Учёт времени', icon: <Timer size={16} />, color: TAB_COLOR },
  { key: 'registration' as AdminTab, label: 'Регистрация', icon: <UserPlus size={16} />, color: TAB_COLOR },
  { key: 'support' as AdminTab, label: 'Поддержка', icon: <Ticket size={16} />, color: TAB_COLOR },
];

const TICKET_STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
  escalated: 'Эскалирован',
};

const TICKET_STATUS_COLORS: Record<string, string> = {
  new: '#F59E0B',
  open: '#3B82F6',
  in_progress: '#8B5CF6',
  resolved: '#10B981',
  closed: '#6B7280',
  escalated: '#EF4444',
};

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

  /* AI key */
  const [aiKey, setAiKey] = useState('');
  const [aiKeyMasked, setAiKeyMasked] = useState('');
  const [aiKeyConfigured, setAiKeyConfigured] = useState(false);
  const [aiKeySaving, setAiKeySaving] = useState(false);

  useEffect(() => {
    fetchAuditEntries();
    fetchTickets();
    fetchIncidents();
    fetchReleases();
    adminApi.getUsers().then(setUsers).catch(() => setUsers([]));
    adminApi.getAIKey()
      .then(res => {
        setAiKeyMasked(res.openai_api_key);
        setAiKeyConfigured(res.configured);
      })
      .catch(() => {
        setAiKeyMasked('');
        setAiKeyConfigured(false);
      });
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

  const handleSaveAIKey = async () => {
    const key = aiKey.trim();
    if (!key) return;
    setAiKeySaving(true);
    try {
      const res = await adminApi.updateAIKey(key);
      setAiKeyMasked(res.openai_api_key);
      setAiKeyConfigured(res.configured);
      setAiKey('');
      toast.success('OpenAI API ключ сохранён');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка сохранения ключа');
    } finally {
      setAiKeySaving(false);
    }
  };

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

      {/* AI key settings */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: 'var(--accent-ai, #a855f7)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Настройки AI</h3>
          {aiKeyConfigured && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(12,114,5,0.12)', color: '#0C7205' }}>
              Настроен
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>OpenAI API ключ</label>
            <input
              type="password"
              value={aiKey}
              onChange={(e) => setAiKey(e.target.value)}
              placeholder={aiKeyMasked || 'sk-...'}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--iris-bg-app)', border: '1px solid var(--iris-border-subtle)', color: 'var(--text-primary)' }}
            />
            {aiKeyMasked && !aiKey && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Сохранённый ключ: {aiKeyMasked}</p>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSaveAIKey}
              disabled={aiKeySaving || !aiKey.trim()}
              className="flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-lg font-medium transition-opacity"
              style={{ background: 'var(--accent-ai, #a855f7)', color: '#fff', opacity: aiKeySaving || !aiKey.trim() ? 0.5 : 1 }}
            >
              {aiKeySaving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              Сохранить ключ
            </button>
          </div>
        </div>
      </Card>

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

/* ═══════════════════════════════════════════════════════════
   SUPPORT TAB — обращения пользователей («Сообщить о проблеме»)
   и полный канбан тикетов
   ═══════════════════════════════════════════════════════════ */
function SupportTab() {
  const tickets = useSupportStore(s => s.tickets);
  const archivedTickets = useSupportStore(s => s.archivedTickets);
  const fetchTickets = useSupportStore(s => s.fetchTickets);
  const fetchArchivedTickets = useSupportStore(s => s.fetchArchivedTickets);
  const updateTicketStatus = useSupportStore(s => s.updateTicketStatus);
  const archiveTicket = useSupportStore(s => s.archiveTicket);
  const unarchiveTicket = useSupportStore(s => s.unarchiveTicket);
  const [view, setView] = useState<'active' | 'archive'>('active');

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (view === 'archive') fetchArchivedTickets();
  }, [view, fetchArchivedTickets]);

  const handleStatusChange = async (id: number, status: TicketStatus) => {
    try {
      await updateTicketStatus(id, status);
      toast.success(`Тикет переведён в статус «${TICKET_STATUS_LABELS[status] || status}»`);
    } catch {
      toast.error('Не удалось обновить статус тикета');
    }
  };

  const handleArchive = async (id: number) => {
    try {
      await archiveTicket(id);
      toast.success('Тикет отправлен в архив');
    } catch {
      toast.error('Не удалось отправить тикет в архив');
    }
  };

  const handleUnarchive = async (id: number) => {
    try {
      await unarchiveTicket(id);
      toast.success('Тикет возвращён из архива');
    } catch {
      toast.error('Не удалось вернуть тикет из архива');
    }
  };

  // Обращения, отправленные через кнопку «Сообщить о проблеме»
  const feedbackTickets = useMemo(
    () =>
      tickets
        .filter(t => t.category === 'feedback')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [tickets],
  );
  const archivedFeedback = useMemo(
    () =>
      archivedTickets
        .filter(t => t.category === 'feedback')
        .sort((a, b) => new Date(b.archived_at || b.created_at).getTime() - new Date(a.archived_at || a.created_at).getTime()),
    [archivedTickets],
  );
  const activeFeedback = feedbackTickets.filter(t =>
    ['new', 'open', 'in_progress', 'escalated'].includes(t.status),
  );
  const resolvedFeedback = feedbackTickets.filter(t =>
    ['resolved', 'closed'].includes(t.status),
  );

  const nextAction = (status: TicketStatus): { label: string; to: TicketStatus } | null => {
    if (status === 'new' || status === 'open') return { label: 'Взять в работу', to: 'in_progress' };
    if (status === 'in_progress' || status === 'escalated') return { label: 'Отметить решённым', to: 'resolved' };
    return null;
  };

  const renderFeedbackCard = (t: (typeof feedbackTickets)[number], archived = false) => {
    const action = nextAction(t.status);
    return (
      <div
        key={t.id}
        className="rounded-lg border p-3"
        style={{ background: 'var(--iris-bg-hover)', borderColor: 'var(--iris-border-subtle)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {t.title}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${TICKET_STATUS_COLORS[t.status] || '#6B7280'}18`,
                  color: TICKET_STATUS_COLORS[t.status] || '#6B7280',
                }}
              >
                {TICKET_STATUS_LABELS[t.status] || t.status}
              </span>
            </div>
            <p className="text-xs mt-1 line-clamp-3 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {t.description}
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {t.requester} · {new Date(t.created_at).toLocaleString('ru-RU')}
              {archived && t.archived_at && ` · в архиве с ${new Date(t.archived_at).toLocaleDateString('ru-RU')}`}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            {action && (
              <button
                type="button"
                onClick={() => handleStatusChange(t.id, action.to)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity"
                style={{ background: 'var(--accent-ai, #a855f7)', color: '#fff' }}
              >
                {action.to === 'resolved' ? <CheckCircle2 size={13} /> : <CircleDot size={13} />}
                {action.label}
              </button>
            )}
            {archived ? (
              <button
                type="button"
                onClick={() => handleUnarchive(t.id)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: 'var(--iris-bg-app)', color: 'var(--text-primary)', border: '1px solid var(--iris-border-subtle)' }}
              >
                <ArchiveRestore size={13} />
                Вернуть из архива
              </button>
            ) : (
              ['resolved', 'closed'].includes(t.status) && (
                <button
                  type="button"
                  onClick={() => handleArchive(t.id)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: 'var(--iris-bg-app)', color: 'var(--text-secondary)', border: '1px solid var(--iris-border-subtle)' }}
                >
                  <Archive size={13} />
                  В архив
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Переключатель видов */}
      <div className="flex items-center gap-2">
        {(
          [
            { key: 'active', label: 'Активные' },
            { key: 'archive', label: `Архив (${archivedFeedback.length})` },
          ] as const
        ).map(v => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
            style={
              view === v.key
                ? { background: 'rgba(255,107,107,0.15)', color: '#FF6B6B' }
                : { background: 'var(--iris-bg-hover)', color: 'var(--text-secondary)' }
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'active' ? (
        <>
          {/* Обращения из «Сообщить о проблеме» */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquareWarning size={16} style={{ color: '#F59E0B' }} />
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  Обращения пользователей
                </h3>
              </div>
              <Badge variant="warning">{activeFeedback.length} активных</Badge>
            </div>

            {feedbackTickets.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
                Обращений пока нет. Они появятся, когда пользователь нажмёт «Сообщить о проблеме».
              </p>
            ) : (
              <div className="space-y-3">
                {activeFeedback.map(t => renderFeedbackCard(t))}
                {resolvedFeedback.map(t => renderFeedbackCard(t))}
              </div>
            )}
          </Card>

          {/* Полный канбан всех тикетов */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Все тикеты</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Нажмите на карточку, чтобы перевести в следующий статус
              </span>
            </div>
            <TicketKanban tickets={tickets} onStatusChange={(id, status) => handleStatusChange(id, status)} />
          </Card>
        </>
      ) : (
        /* Архив обращений */
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Archive size={16} style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Архив обращений
              </h3>
            </div>
            <Badge variant="info">{archivedFeedback.length}</Badge>
          </div>

          {archivedFeedback.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: 'var(--text-muted)' }}>
              Архив пуст. Решённые обращения можно отправить сюда кнопкой «В архив».
            </p>
          ) : (
            <div className="space-y-3">
              {archivedFeedback.map(t => renderFeedbackCard(t, true))}
            </div>
          )}
        </Card>
      )}
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
      {activeTab === 'registration' && <RegistrationTab />}
      {activeTab === 'support' && <SupportTab />}
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
