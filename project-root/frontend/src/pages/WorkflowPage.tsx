import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight, Search, Plus, Filter, AlertTriangle, Clock, CheckCircle2,
  XCircle, Eye, MessageSquare, User, Calendar, FileText, ChevronDown,
  Send, Trash2, Edit3
} from 'lucide-react';

/* ── Types ── */
type RemarkStatus = 'open' | 'in_progress' | 'fixed' | 'verified' | 'closed';
type RemarkPriority = 'critical' | 'high' | 'normal';

interface RemarkComment {
  id: string;
  author: string;
  date: string;
  text: string;
}

interface Remark {
  id: string;
  title: string;
  documentCode: string;
  documentName: string;
  project: string;
  status: RemarkStatus;
  priority: RemarkPriority;
  author: string;
  assignee: string;
  createdAt: string;
  deadline: string;
  description: string;
  comments: RemarkComment[];
}

/* ── Configs ── */
const statusConfig: Record<RemarkStatus, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  open:       { label: 'Открыто',       color: '#FF6B6B', bg: 'rgba(255,107,107,0.15)', border: 'rgba(255,107,107,0.4)', icon: <AlertTriangle size={12} /> },
  in_progress:{ label: 'В работе',      color: '#D4AF37', bg: 'rgba(212,175,55,0.15)',  border: 'rgba(212,175,55,0.4)',  icon: <Clock size={12} /> },
  fixed:      { label: 'Исправлено',    color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)',  border: 'rgba(79,122,76,0.4)',  icon: <CheckCircle2 size={12} /> },
  verified:   { label: 'Проверено',     color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', icon: <Eye size={12} /> },
  closed:     { label: 'Закрыто',       color: '#6B7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.4)', icon: <XCircle size={12} /> },
};

const priorityConfig: Record<RemarkPriority, { label: string; color: string; bg: string }> = {
  critical: { label: 'Критично', color: '#FF6B6B', bg: 'rgba(255,107,107,0.2)' },
  high:     { label: 'Важно',    color: '#D4AF37', bg: 'rgba(212,175,55,0.2)' },
  normal:   { label: 'Нормально',color: '#94A3B8', bg: 'rgba(148,163,184,0.2)' },
};

/* ── Mock data ── */
const remarksData: Remark[] = [
  {
    id: 'r1', title: 'Несоответствие арматуры в узле КЖ-01-001', documentCode: 'КЖ-01-001', documentName: 'Сборочный чертёж корпуса', project: 'ЖК «Северный»',
    status: 'open', priority: 'critical', author: 'Петров В.К.', assignee: 'Иванов А.С.', createdAt: '09.05.2026', deadline: '12.05.2026',
    description: 'В узле примыкания балки к колонне указана арматура Ø12, но по расчёту требуется Ø16. Необходимо пересмотреть узел.',
    comments: [
      { id: 'c1', author: 'Петров В.К.', date: '09.05.2026 14:30', text: 'Прошу срочно исправить, стройка ждёт.' },
    ],
  },
  {
    id: 'r2', title: 'Отсутствует отметка уровня пола', documentCode: 'АР-03-015', documentName: 'Планировочное решение этажа', project: 'ТЦ «Меридиан»',
    status: 'in_progress', priority: 'high', author: 'Козлов Д.А.', assignee: 'Сидорова Е.М.', createdAt: '08.05.2026', deadline: '15.05.2026',
    description: 'На плане отсутствует отметка уровня пола 2 этажа. Требуется добавить отметку ±0.000 и все привязки.',
    comments: [
      { id: 'c1', author: 'Козлов Д.А.', date: '08.05.2026 10:15', text: 'Добавьте, пожалуйста, отметки на всех планах.' },
      { id: 'c2', author: 'Сидорова Е.М.', date: '08.05.2026 16:45', text: 'Принято в работу, будет готово к 15.05.' },
    ],
  },
  {
    id: 'r3', title: 'Уточнение по вентиляции подвала', documentCode: 'ОВиК-02-008', documentName: 'Схема вентиляции подвала', project: 'Склад А-12',
    status: 'fixed', priority: 'normal', author: 'Иванов А.С.', assignee: 'Новикова И.П.', createdAt: '07.05.2026', deadline: '10.05.2026',
    description: 'Требуется уточнить производительность вентилятора в подвале. Сейчас указано 1000 м³/ч, по расчёту нужно 1500 м³/ч.',
    comments: [
      { id: 'c1', author: 'Иванов А.С.', date: '07.05.2026 09:00', text: 'Проверьте расчёт, пожалуйста.' },
      { id: 'c2', author: 'Новикова И.П.', date: '09.05.2026 11:20', text: 'Исправлено, вентилятор заменён на 1500 м³/ч.' },
    ],
  },
  {
    id: 'r4', title: 'Ошибка в спецификации кабелей', documentCode: 'ЭОМ-05-003', documentName: 'Однолинейная схема ТЭЦ-5', project: 'ТЭЦ-5',
    status: 'verified', priority: 'high', author: 'Сидорова Е.М.', assignee: 'Козлов Д.А.', createdAt: '06.05.2026', deadline: '09.05.2026',
    description: 'В спецификации указан кабель ВВГнг 4×16, но по нагрузке требуется ВВГнг 4×25.',
    comments: [
      { id: 'c1', author: 'Сидорова Е.М.', date: '06.05.2026 13:00', text: 'Критично — подстанция уже заказывает кабель.' },
      { id: 'c2', author: 'Козлов Д.А.', date: '07.05.2026 15:30', text: 'Исправлено, спецификация обновлена.' },
      { id: 'c3', author: 'Иванов А.С.', date: '09.05.2026 10:00', text: 'Проверено, соответствует расчёту.' },
    ],
  },
  {
    id: 'r5', title: 'Уточнение по бетону в фундаменте', documentCode: 'КР-01-002', documentName: 'Расчёт железобетонных конструкций', project: 'ТЭЦ-5',
    status: 'closed', priority: 'normal', author: 'Петров В.К.', assignee: 'Петров В.К.', createdAt: '05.05.2026', deadline: '06.05.2026',
    description: 'Уточнить марку бетона для фундамента ТЭЦ-5. Решено: B25.',
    comments: [
      { id: 'c1', author: 'Петров В.К.', date: '05.05.2026 11:00', text: 'Марка бетона B25 подтверждена заказчиком.' },
      { id: 'c2', author: 'Иванов А.С.', date: '06.05.2026 09:00', text: 'Закрыто, внесено в спецификацию.' },
    ],
  },
];

/* ── Helpers ── */
function StatusBadge({ status }: { status: RemarkStatus }) {
  const cfg = statusConfig[status];
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border" style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>{cfg.icon}{cfg.label}</span>;
}

function PriorityBadge({ priority }: { priority: RemarkPriority }) {
  const cfg = priorityConfig[priority];
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>;
}

/* ── Main Page ── */
export default function WorkflowPage() {
  const navigate = useNavigate();
  const [remarks, setRemarks] = useState<Remark[]>(remarksData);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<RemarkStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<RemarkPriority | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const filtered = remarks.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.documentCode.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchPriority = filterPriority === 'all' || r.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const addComment = (remarkId: string) => {
    if (!newComment.trim()) return;
    setRemarks(prev => prev.map(r => {
      if (r.id !== remarkId) return r;
      return {
        ...r,
        comments: [...r.comments, { id: `c${Date.now()}`, author: 'Администратор', date: new Date().toLocaleString('ru-RU'), text: newComment }],
      };
    }));
    setNewComment('');
  };

  const moveStatus = (id: string, newStatus: RemarkStatus) => {
    setRemarks(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  const stats = {
    open: remarks.filter(r => r.status === 'open').length,
    in_progress: remarks.filter(r => r.status === 'in_progress').length,
    fixed: remarks.filter(r => r.status === 'fixed').length,
    critical: remarks.filter(r => r.priority === 'critical').length,
  };

  return (
    <div className="min-h-screen w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Документооборот</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Замечания и согласования по документам</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск замечания..." className="bg-transparent outline-none text-sm w-40 md:w-56" style={{ color: 'var(--text-primary)' }} />
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #DC2626 100%)', boxShadow: '0 4px 16px rgba(255,107,107,0.35)' }}>
            <Plus size={16} /> Новое замечание
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Открытые', value: stats.open, color: '#FF6B6B', icon: <AlertTriangle size={18} /> },
          { label: 'В работе', value: stats.in_progress, color: '#D4AF37', icon: <Clock size={18} /> },
          { label: 'Исправлено', value: stats.fixed, color: '#4F7A4C', icon: <CheckCircle2 size={18} /> },
          { label: 'Критичных', value: stats.critical, color: '#DC2626', icon: <AlertTriangle size={18} /> },
        ].map(s => (
          <div key={s.label} className="neon-red p-4 flex items-center gap-3" style={{ background: 'var(--card-bg)' }}>
            <span style={{ color: s.color }}>{s.icon}</span>
            <div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as RemarkStatus | 'all')} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="all">Все статусы</option>
          {Object.entries(statusConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as RemarkPriority | 'all')} className="px-3 py-2 rounded-lg text-sm outline-none" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
          <option value="all">Все приоритеты</option>
          {Object.entries(priorityConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
        </select>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Найдено: {filtered.length}</span>
      </div>

      {/* Remarks List */}
      <div className="space-y-4">
        {filtered.map(remark => {
          const isExpanded = expandedId === remark.id;
          const isOverdue = remark.deadline < new Date().toISOString().split('T')[0] && remark.status !== 'closed';

          return (
            <div key={remark.id} className="neon-red p-4 md:p-5 space-y-3" style={{ background: 'var(--card-bg)' }}>
              {/* Header row */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{remark.title}</h3>
                    <PriorityBadge priority={remark.priority} />
                    {isOverdue && <span className="text-xs px-2 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-500/30">Просрочено</span>}
                  </div>
                  <div className="text-xs flex items-center gap-3 flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><FileText size={10} /> {remark.documentCode}</span>
                    <span>{remark.documentName}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> Дедлайн: {remark.deadline}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={remark.status} />
                  <button onClick={() => setExpandedId(isExpanded ? null : remark.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--iris-bg-hover)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                    <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1"><User size={10} /> Автор: {remark.author}</span>
                <span className="flex items-center gap-1"><User size={10} /> Исполнитель: {remark.assignee}</span>
                <span className="flex items-center gap-1"><Calendar size={10} /> Создано: {remark.createdAt}</span>
                <span className="flex items-center gap-1"><MessageSquare size={10} /> {remark.comments.length} коммент.</span>
              </div>

              {/* Description */}
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{remark.description}</p>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {remark.status === 'open' && (
                  <button onClick={() => moveStatus(remark.id, 'in_progress')} className="text-xs px-3 py-1.5 rounded border flex items-center gap-1" style={{ color: '#D4AF37', borderColor: 'rgba(212,175,55,0.3)' }}><Clock size={12} /> Взять в работу</button>
                )}
                {remark.status === 'in_progress' && (
                  <button onClick={() => moveStatus(remark.id, 'fixed')} className="text-xs px-3 py-1.5 rounded border flex items-center gap-1" style={{ color: '#4F7A4C', borderColor: 'rgba(79,122,76,0.3)' }}><CheckCircle2 size={12} /> Исправлено</button>
                )}
                {remark.status === 'fixed' && (
                  <button onClick={() => moveStatus(remark.id, 'verified')} className="text-xs px-3 py-1.5 rounded border flex items-center gap-1" style={{ color: '#3B82F6', borderColor: 'rgba(59,130,246,0.3)' }}><Eye size={12} /> Проверено</button>
                )}
                {remark.status === 'verified' && (
                  <button onClick={() => moveStatus(remark.id, 'closed')} className="text-xs px-3 py-1.5 rounded border flex items-center gap-1" style={{ color: '#6B7280', borderColor: 'rgba(107,114,128,0.3)' }}><XCircle size={12} /> Закрыть</button>
                )}
                <button onClick={() => navigate(`/documents?code=${remark.documentCode}`)} className="text-xs px-3 py-1.5 rounded border flex items-center gap-1" style={{ color: '#9B8EC7', borderColor: 'rgba(107,91,149,0.3)' }}><FileText size={12} /> К документу</button>
              </div>

              {/* Expanded: Comments */}
              {isExpanded && (
                <div className="border-t pt-3 space-y-3" style={{ borderColor: 'var(--border-divider)' }}>
                  <h4 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Комментарии</h4>
                  <div className="space-y-2">
                    {remark.comments.map(c => (
                      <div key={c.id} className="flex gap-3 text-sm p-2 rounded-lg" style={{ background: 'var(--iris-bg-hover)' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--iris-accent-blue)', color: '#fff' }}>
                          {c.author.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{c.author}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{c.date}</span>
                          </div>
                          <p style={{ color: 'var(--text-secondary)' }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Добавить комментарий..." className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                    <button onClick={() => addComment(remark.id)} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#FF6B6B' }}><Send size={14} /></button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Замечания не найдены. Измените фильтры или создайте новое.</p>
        </div>
      )}
    </div>
  );
}
