import { useState, useEffect } from 'react';
import { getTasks } from '@/api/tasks';
import { getRemarks } from '@/api/remarks';
import type { Task } from '@/types';
import type { RemarkListItem } from '@/types/remarks';
import { Loader2, CheckCircle2, Circle, AlertCircle, ArrowRight, Upload, Search, FileCheck, Archive, Plus, Filter } from 'lucide-react';

/* ── Mock fallback data ── */
const mockTasks: Task[] = [
  { id: 1, title: 'Согласовать КЖ-01-001 ЖК «Северный»', status: 'NEW', priority: 'HIGH', due_date: '2026-05-25', project_id: 1, assignee_id: 2, author_id: 1, created_at: '2026-05-20', updated_at: '2026-05-20' },
  { id: 2, title: 'Проверить АР-03-015 ТЦ «Меридиан»', status: 'IN_PROGRESS', priority: 'NORMAL', due_date: '2026-05-28', project_id: 2, assignee_id: 3, author_id: 1, created_at: '2026-05-18', updated_at: '2026-05-21' },
  { id: 3, title: 'Утвердить ОВиК-02-008 Склад А-12', status: 'DONE', priority: 'LOW', due_date: '2026-05-20', project_id: 3, assignee_id: 4, author_id: 2, created_at: '2026-05-15', updated_at: '2026-05-22' },
  { id: 4, title: 'Согласовать ЭОМ-05-003 ТЭЦ-5', status: 'NEW', priority: 'HIGH', due_date: '2026-05-30', project_id: 4, assignee_id: 2, author_id: 3, created_at: '2026-05-22', updated_at: '2026-05-22' },
  { id: 5, title: 'Проверить КР-01-002 ТЭЦ-5 (расчёт)', status: 'IN_PROGRESS', priority: 'NORMAL', due_date: '2026-06-05', project_id: 4, assignee_id: 5, author_id: 1, created_at: '2026-05-19', updated_at: '2026-05-21' },
  { id: 6, title: 'Утвердить АР-04-001 Офис «Гамма»', status: 'DONE', priority: 'LOW', due_date: '2026-05-18', project_id: 5, assignee_id: 3, author_id: 2, created_at: '2026-05-10', updated_at: '2026-05-18' },
];

const mockRemarks: RemarkListItem[] = [
  { id: 'r1', title: 'Несоответствие арматуры в КЖ-01-001', status: 'new', priority: 'high', category: 'КЖ', author_name: 'Иванов А.С.', created_at: '2026-05-22', project_name: 'ЖК «Северный»', document_code: 'КЖ-01-001', assignee_name: 'Петров В.К.', status_label: 'Новое' },
  { id: 'r2', title: 'Уточнение вентфасада ТЦ «Меридиан»', status: 'in_progress', priority: 'medium', category: 'АР', author_name: 'Сидорова Е.М.', created_at: '2026-05-21', project_name: 'ТЦ «Меридиан»', document_code: 'АР-03-015', assignee_name: 'Козлов Д.А.', status_label: 'В работе' },
  { id: 'r3', title: 'Замечания по гидроизоляции подвала', status: 'resolved', priority: 'high', category: 'КР', author_name: 'Новикова И.П.', created_at: '2026-05-20', project_name: 'ЖК «Северный»', document_code: 'КР-01-002', assignee_name: 'Петров В.К.', status_label: 'Устранено' },
  { id: 'r4', title: 'Корректировка однолинейной схемы', status: 'new', priority: 'low', category: 'ЭОМ', author_name: 'Козлов Д.А.', created_at: '2026-05-23', project_name: 'ТЭЦ-5', document_code: 'ЭОМ-05-003', assignee_name: 'Иванов А.С.', status_label: 'Новое' },
  { id: 'r5', title: 'Узел балка-колонна: уточнить защитный слой', status: 'in_progress', priority: 'medium', category: 'КЖ', author_name: 'Петров В.К.', created_at: '2026-05-19', project_name: 'ЖК «Южный парк»', document_code: 'КЖ-02-004', assignee_name: 'Сидорова Е.М.', status_label: 'В работе' },
];

const TAB_COLOR = '#F59E0B';

export function WorkflowPage() {
  const [tab, setTab] = useState<'tasks' | 'remarks'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [remarks, setRemarks] = useState<RemarkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'NEW' | 'IN_PROGRESS' | 'DONE'>('all');
  const [remarkSearch, setRemarkSearch] = useState('');
  const [remarkFilter, setRemarkFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksData, remarksData] = await Promise.all([
        getTasks(),
        getRemarks({ page: 1, page_size: 50 }),
      ]);
      setTasks(tasksData.length ? tasksData : mockTasks);
      setRemarks(remarksData.items?.length ? remarksData.items : mockRemarks);
    } catch (err) {
      console.error('Failed to load workflow data:', err);
      setTasks(mockTasks);
      setRemarks(mockRemarks);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
    const matchStatus = taskFilter === 'all' || t.status === taskFilter;
    return matchSearch && matchStatus;
  });

  const filteredRemarks = remarks.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(remarkSearch.toLowerCase());
    const matchStatus = remarkFilter === 'all' || r.status === remarkFilter;
    return matchSearch && matchStatus;
  });

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'IN_PROGRESS': return <Circle size={16} className="text-blue-500" />;
      case 'NEW': return <Circle size={16} className="text-gray-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getTaskStatusLabel = (status: string) => {
    switch (status) {
      case 'DONE': return 'Выполнена';
      case 'IN_PROGRESS': return 'В работе';
      case 'NEW': return 'Новая';
      default: return status;
    }
  };

  const getTaskStatusStyle = (status: string) => {
    switch (status) {
      case 'DONE': return { color: '#4F7A4C', bg: 'rgba(79,122,76,0.15)', border: 'rgba(79,122,76,0.4)' };
      case 'IN_PROGRESS': return { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)' };
      case 'NEW': return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
      default: return { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' };
    }
  };

  const getRemarkStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-yellow-100 text-yellow-700';
      case 'new': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRemarkStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Устранено';
      case 'in_progress': return 'В работе';
      case 'new': return 'Новое';
      default: return status;
    }
  };

  // Процессные карточки
  const processCards = [
    { icon: <Upload size={20} />, count: tasks.filter(t => t.status === 'NEW').length, label: 'Загрузка', color: '#3B82F6' },
    { icon: <Search size={20} />, count: tasks.filter(t => t.status === 'IN_PROGRESS').length, label: 'Проверка', color: '#8B5CF6' },
    { icon: <FileCheck size={20} />, count: remarks.filter(r => r.status === 'in_progress').length, label: 'Согласование', color: '#F59E0B' },
    { icon: <Archive size={20} />, count: tasks.filter(t => t.status === 'DONE').length, label: 'Архив', color: '#6B7280' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Документооборот</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Управление задачами согласования и замечаниями</p>
        </div>
        <button className="px-4 py-2 rounded-lg text-sm font-medium text-white flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', boxShadow: '0 4px 16px rgba(245,158,11,0.35)' }}>
          <Plus size={16} /> Новая задача
        </button>
      </div>

      {/* 4 карточки-процесса */}
      <div className="flex flex-wrap items-center gap-3">
        {processCards.map((card, idx) => (
          <div key={card.label} className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-white" style={{ backgroundColor: card.color }}>
              {card.icon}
              <div>
                <div className="text-lg font-bold">{card.count}</div>
                <div className="text-xs opacity-90">{card.label}</div>
              </div>
            </div>
            {idx < processCards.length - 1 && (
              <ArrowRight size={20} className="text-[#94a3b8]" />
            )}
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b" style={{ borderColor: 'var(--border-divider)' }}>
        {[
          { key: 'tasks' as const, label: 'Согласования', icon: <FileCheck size={16} />, count: filteredTasks.length },
          { key: 'remarks' as const, label: 'Замечания', icon: <AlertCircle size={16} />, count: filteredRemarks.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative px-4 py-2.5 text-sm font-medium transition-all flex items-center gap-2"
            style={{
              color: tab === t.key ? TAB_COLOR : 'var(--text-secondary)',
              backgroundColor: tab === t.key ? `${TAB_COLOR}26` : 'transparent',
            }}
          >
            {t.icon} {t.label} ({t.count})
            {tab === t.key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-4/5 rounded-full" style={{ backgroundColor: TAB_COLOR, boxShadow: `0 0 8px ${TAB_COLOR}` }} />}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: TAB_COLOR }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка...</span>
        </div>
      )}

      {/* ── TASKS TAB ── */}
      {!loading && tab === 'tasks' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input value={taskSearch} onChange={e => setTaskSearch(e.target.value)} placeholder="Поиск по задаче..." className="bg-transparent outline-none text-sm w-48 md:w-72" style={{ color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              {(['all', 'NEW', 'IN_PROGRESS', 'DONE'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTaskFilter(s)}
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors"
                  style={{
                    color: taskFilter === s ? getTaskStatusStyle(s).color : 'var(--text-secondary)',
                    borderColor: taskFilter === s ? getTaskStatusStyle(s).border : 'var(--border-default)',
                    background: taskFilter === s ? getTaskStatusStyle(s).bg : 'transparent',
                  }}
                >
                  {s === 'all' ? 'Все' : getTaskStatusLabel(s)}
                </button>
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Найдено: {filteredTasks.length}</span>
          </div>

          {/* Task cards */}
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Задачи не найдены. Измените фильтры или создайте новую.</p>
              </div>
            ) : (
              filteredTasks.map((task) => {
                const st = getTaskStatusStyle(task.status);
                return (
                  <div key={task.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                      {getTaskStatusIcon(task.status)}
                      <div>
                        <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded border font-medium" style={{ color: st.color, borderColor: st.border, background: st.bg }}>{getTaskStatusLabel(task.status)}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start sm:self-auto ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      task.priority === 'NORMAL' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{task.priority}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── REMARKS TAB ── */}
      {!loading && tab === 'remarks' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input value={remarkSearch} onChange={e => setRemarkSearch(e.target.value)} placeholder="Поиск по замечанию..." className="bg-transparent outline-none text-sm w-48 md:w-72" style={{ color: 'var(--text-primary)' }} />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              {(['all', 'new', 'in_progress', 'resolved'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setRemarkFilter(s)}
                  className="text-xs px-2.5 py-1 rounded-md border transition-colors"
                  style={{
                    color: remarkFilter === s ? '#F59E0B' : 'var(--text-secondary)',
                    borderColor: remarkFilter === s ? 'rgba(245,158,11,0.4)' : 'var(--border-default)',
                    background: remarkFilter === s ? 'rgba(245,158,11,0.1)' : 'transparent',
                  }}
                >
                  {s === 'all' ? 'Все' : getRemarkStatusLabel(s)}
                </button>
              ))}
            </div>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Найдено: {filteredRemarks.length}</span>
          </div>

          {/* Remark cards */}
          <div className="space-y-2">
            {filteredRemarks.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Замечания не найдены. Измените фильтры или создайте новое.</p>
              </div>
            ) : (
              filteredRemarks.map((remark) => (
                <div key={remark.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-default)' }}>
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{remark.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>{remark.project_name}</span>
                      <span>·</span>
                      <span>{remark.document_code}</span>
                      <span>·</span>
                      <span>Приоритет: {remark.priority}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium self-start sm:self-auto ${getRemarkStatusColor(remark.status)}`}>{getRemarkStatusLabel(remark.status)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
