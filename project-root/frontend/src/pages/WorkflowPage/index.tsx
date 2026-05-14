import { useState, useEffect } from 'react';
import { getTasks } from '@/api/tasks';
import { getRemarks } from '@/api/remarks';
import type { Task } from '@/types';
import type { RemarkListItem } from '@/types/remarks';
import { Loader2, CheckCircle2, Circle, AlertCircle, ArrowRight, Upload, Search, FileCheck, Archive } from 'lucide-react';

export function WorkflowPage() {
  const [tab, setTab] = useState<'tasks' | 'remarks'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [remarks, setRemarks] = useState<RemarkListItem[]>([]);
  const [loading, setLoading] = useState(true);

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
      setTasks(tasksData);
      setRemarks(remarksData.items);
    } catch (err) {
      console.error('Failed to load workflow data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'IN_PROGRESS': return <Circle size={16} className="text-blue-500" />;
      case 'NEW': return <Circle size={16} className="text-gray-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
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

  // Процессные карточки (как на промо)
  const processCards = [
    { icon: <Upload size={20} />, count: tasks.filter(t => t.status === 'NEW').length, label: 'Загрузка', color: '#3B82F6' },
    { icon: <Search size={20} />, count: tasks.filter(t => t.status === 'IN_PROGRESS').length, label: 'Проверка', color: '#8B5CF6' },
    { icon: <FileCheck size={20} />, count: remarks.filter(r => r.status === 'in_progress').length, label: 'Согласование', color: '#F59E0B' },
    { icon: <Archive size={20} />, count: tasks.filter(t => t.status === 'DONE').length, label: 'Архив', color: '#6B7280' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Документооборот</h1>

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

      {/* Табы */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <button onClick={() => setTab('tasks')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === 'tasks' ? 'text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          style={tab === 'tasks' ? { backgroundColor: 'var(--accent-engineering)' } : { color: 'var(--text-secondary)' }}>
          Задачи согласования ({tasks.length})
        </button>
        <button onClick={() => setTab('remarks')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === 'remarks' ? 'text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          style={tab === 'remarks' ? { backgroundColor: 'var(--accent-engineering)' } : { color: 'var(--text-secondary)' }}>
          Замечания ({remarks.length})
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent-engineering)' }} />
          <span className="ml-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Загрузка...</span>
        </div>
      )}

      {!loading && tab === 'tasks' && (
        <div className="space-y-2">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет задач</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <div className="flex items-center gap-3">
                  {getTaskStatusIcon(task.status)}
                  <div>
                    <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Статус: {task.status} | Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString('ru-RU') : '—'}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                  task.priority === 'NORMAL' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{task.priority}</span>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === 'remarks' && (
        <div className="space-y-2">
          {remarks.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: 'var(--text-tertiary)' }}>Нет замечаний</div>
          ) : (
            remarks.map((remark) => (
              <div key={remark.id} className="rounded-lg border p-4 flex items-center justify-between" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
                <div>
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{remark.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Приоритет: {remark.priority} | Категория: {remark.category}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRemarkStatusColor(remark.status)}`}>{remark.status}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
