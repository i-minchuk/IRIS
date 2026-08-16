import { useState, useEffect, useMemo } from 'react';
import { getTasks } from '@/features/tasks/api/tasks';
import { getRemarks } from '@/features/remarks/api/remarks';
import type { Task } from '@/types';
import type { RemarkListItem } from '@/types/remarks';
import { Loader2, CheckCircle2, Circle, AlertCircle, ArrowRight, Upload, Search, FileCheck, Archive, Plus, Filter } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';

const TAB_COLOR = '#F59E0B';

const PIE_COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];
const LINE_COLORS = ['#3B82F6', '#10B981', '#EF4444'];

function tooltipStyle() {
  return {
    backgroundColor: 'var(--iris-bg-tooltip, rgba(11,14,20,0.95))',
    border: '1px solid var(--iris-border-subtle, rgba(255,255,255,0.1))',
    borderRadius: '8px',
    color: 'var(--iris-text-inverse, #E2E8F0)',
    fontSize: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.50)',
  };
}

export function WorkflowPage() {
  const [tab, setTab] = useState<'tasks' | 'remarks'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [remarks, setRemarks] = useState<RemarkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskFilter, setTaskFilter] = useState<'all' | 'NEW' | 'IN_PROGRESS' | 'DONE'>('all');
  const [remarkSearch, setRemarkSearch] = useState('');
  const [remarkFilter, setRemarkFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, []);

  const loadData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [tasksData, remarksData] = await Promise.all([
        getTasks(),
        getRemarks({ page: 1, page_size: 50 }),
      ]);
      if (signal?.aborted) return;
      setTasks(tasksData);
      setRemarks(remarksData.items ?? []);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      console.error('Failed to load workflow data:', err);
      setError('Не удалось загрузить данные. Попробуйте обновить страницу.');
      setTasks([]);
      setRemarks([]);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
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

  // ── Chart data ──
  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const label = t.status === 'NEW' ? 'Новые' : t.status === 'IN_PROGRESS' ? 'В работе' : t.status === 'DONE' ? 'Выполнены' : t.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const templateBarData = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach(t => {
      const template = t.title.split(':')[0] || 'Без шаблона';
      counts[template] = (counts[template] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  const monthlyLineData = useMemo(() => {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const counts: Record<string, number> = {};
    months.forEach(m => counts[m] = 0);
    tasks.forEach(t => {
      const date = t.due_date ? new Date(t.due_date) : null;
      if (date) {
        const m = months[date.getMonth()];
        counts[m] = (counts[m] || 0) + 1;
      }
    });
    return months.map(m => ({ month: m, count: counts[m] || 0 }));
  }, [tasks]);

  const chartTextColor = 'var(--text-secondary, #8892A8)';
  const chartGridColor = 'var(--border-divider, rgba(255,255,255,0.06))';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="sr-only" style={{ color: 'var(--text-primary)' }}>Документооборот</h1>
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

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PieChart: статусы */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Распределение по статусам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: chartTextColor, strokeOpacity: 0.4 }}
                >
                  {statusPieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.85} stroke="var(--card-bg)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} formatter={(value, _name, props: any) => [`${value}`, props?.payload?.name ?? '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BarChart: шаблоны */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>По шаблонам</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templateBarData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 10 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Количество']} />
                <Bar dataKey="value" name="Количество" radius={[4, 4, 0, 0]}>
                  {templateBarData.map((_entry, index) => (
                    <Cell key={`bar-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LineChart: динамика по месяцам */}
        <div className="p-3 rounded-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Динамика запусков</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLineData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                <XAxis dataKey="month" tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} axisLine={{ stroke: chartGridColor }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle()} formatter={(value) => [`${value}`, 'Запуски']} />
                <Line type="monotone" dataKey="count" name="Запуски" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 3, strokeWidth: 2, fill: 'var(--card-bg)' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
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

      {error && !loading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => loadData()}
            className="ml-auto text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 transition-colors"
          >
            Обновить
          </button>
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
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Найдено: {filteredTasks.length}</span>
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
                          <span className="text-xs px-1.5 py-0.5 rounded border font-medium" style={{ color: st.color, borderColor: st.border, background: st.bg }}>{getTaskStatusLabel(task.status)}</span>
                          <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}</span>
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
            <span className="text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>Найдено: {filteredRemarks.length}</span>
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
                    <div className="flex items-center gap-2 mt-1 text-base md:text-lg font-medium leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>{remark.project_name}</span>
                      <span>·</span>
                      <span>{remark.document_name}</span>
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

export default WorkflowPage;
