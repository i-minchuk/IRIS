import React, { useEffect, useState } from 'react';
import { Calendar, AlertCircle, Play, Square } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';

interface TaskTableProps {
  tasks: Task[];
  selectedTask: Task | null;
  onSelectTask: (task: Task) => void;
  onStatusChange: (taskId: number, newStatus: string) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onStartTask?: (taskId: number) => void;
  onStopTask?: (taskId: number) => void;
  activeTaskId?: number | null;
  taskTimers?: Record<number, number>;
}

const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  new: { label: 'Новая', color: '#6b7280' },
  in_progress: { label: 'В работе', color: '#3b82f6' },
  on_hold: { label: 'На паузе', color: '#f59e0b' },
  done: { label: 'Выполнена', color: '#10b981' },
  cancelled: { label: 'Отменена', color: '#ef4444' },
  review: { label: 'На проверке', color: '#8b5cf6' },
  approval: { label: 'На согласовании', color: '#ec4899' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Низкий', color: '#6b7280' },
  normal: { label: 'Средний', color: '#3b82f6' },
  high: { label: 'Высокий', color: '#f59e0b' },
  critical: { label: 'Критический', color: '#ef4444' },
};

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  selectedTask,
  onSelectTask,
  onStatusChange,
  onPageChange,
  currentPage,
  pageSize,
  totalCount,
  onStartTask,
  onStopTask,
  activeTaskId,
  taskTimers = {},
}) => {
  const totalPages = Math.ceil(totalCount / pageSize);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU');
  };

  const getOverdueBadge = (task: Task) => {
    if (task.overdueDays === null || task.overdueDays <= 0) return null;
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: 'var(--iris-accent-red)', color: '#ffffff' }}
      >
        <AlertCircle size={12} />
        +{task.overdueDays} дн.
      </span>
    );
  };

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (activeTaskId == null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeTaskId]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgressIndicator = (task: Task) => {
    if (task.percentComplete === 0 || task.status === 'new') return null;
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--iris-bg-app)' }}>
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${task.percentComplete}%`,
              background: task.status === 'done' ? 'var(--iris-accent-green)' : 'var(--iris-accent-blue)'
            }}
          />
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.percentComplete}%</span>
      </div>
    );
  };

  const getTimerDisplay = (task: Task) => {
    const base = taskTimers[task.id] || 0;
    const isActive = activeTaskId === task.id;
    const elapsed = isActive ? Math.floor((now - (task.startedAt ? new Date(task.startedAt).getTime() : now)) / 1000) : 0;
    const total = base + (isActive ? elapsed : 0);
    if (total <= 0 && !isActive) return null;
    return (
      <span className="text-xs font-mono" style={{ color: isActive ? 'var(--iris-accent-green)' : 'var(--text-muted)' }}>
        {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse" />}
        {formatDuration(total)}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Таблица */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10"
            style={{ background: 'var(--iris-bg-surface)' }}
          >
            <tr style={{ borderBottom: '2px solid var(--iris-border-subtle)' }}>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Проект</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Связь</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Задача</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Тип</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Статус</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Приоритет</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Исполнитель</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Дедлайн</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Прогресс</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Время</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={`cursor-pointer transition-colors ${
                  selectedTask?.id === task.id ? 'ring-2 ring-inset' : 'hover:bg-opacity-50'
                }`}
                style={{
                  background: selectedTask?.id === task.id ? 'var(--iris-accent-blue-transparent)' : 'transparent',
                  borderColor: selectedTask?.id === task.id ? 'var(--iris-accent-blue)' : 'transparent',
                }}
              >
                <td className="px-4 py-3">
                  {task.projectCode && (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.projectCode}</span>
                      {task.projectName && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{task.projectName}</span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {task.operationName && (
                    <div className="flex flex-col">
                      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>🔧 {task.operationCode || 'Оп'}</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{task.operationName}</span>
                    </div>
                  )}
                  {task.documentNumber && (
                    <div className="flex flex-col">
                      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>📄 {task.documentNumber}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs">
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.title}</div>
                    {task.description && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{task.description}</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {task.type === 'production' && '🏭'}
                    {task.type === 'document' && '📄'}
                    {task.type === 'approval' && '✅'}
                    {task.type === 'review' && '👀'}
                    {task.type === 'issue' && '⚠️'}
                    {task.type === 'other' && '📌'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      onStatusChange(task.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: statusConfig[task.status].color + '20',
                      color: statusConfig[task.status].color,
                      border: 'none',
                    }}
                  >
                    {Object.entries(statusConfig).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      background: priorityConfig[task.priority].color + '20',
                      color: priorityConfig[task.priority].color,
                    }}
                  >
                    {priorityConfig[task.priority].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {task.assigneeName ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{ background: 'var(--iris-accent-blue)', color: '#ffffff' }}
                      >
                        {task.assigneeName.charAt(0)}
                      </div>
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{task.assigneeName}</span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Не назначен</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(task.dueDate)}</span>
                    {getOverdueBadge(task)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getProgressIndicator(task)}
                </td>
                <td className="px-4 py-3">
                  {getTimerDisplay(task)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {activeTaskId === task.id ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStopTask?.(task.id);
                        }}
                        className="p-1.5 rounded-md transition-colors hover:bg-red-100"
                        style={{ color: 'var(--iris-accent-red)' }}
                        title="Стоп"
                      >
                        <Square size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartTask?.(task.id);
                        }}
                        className="p-1.5 rounded-md transition-colors hover:bg-green-100"
                        style={{ color: 'var(--iris-accent-green)' }}
                        title="Старт"
                      >
                        <Play size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-surface)' }}
        >
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Показано {Math.min((currentPage - 1) * pageSize + 1, totalCount)} - {Math.min(currentPage * pageSize, totalCount)} из {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded text-sm disabled:opacity-50"
              style={{
                background: 'var(--iris-bg-app)',
                border: '1px solid var(--iris-border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              ← Назад
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Стр. {currentPage} из {totalPages}
            </span>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 rounded text-sm disabled:opacity-50"
              style={{
                background: 'var(--iris-bg-app)',
                border: '1px solid var(--iris-border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              Вперед →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
