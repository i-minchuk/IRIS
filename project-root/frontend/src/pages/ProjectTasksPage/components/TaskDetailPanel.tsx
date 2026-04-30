import React from 'react';
import { X, Calendar, User, CheckCircle, AlertCircle, Flag, Clock } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface TaskDetailPanelProps {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: number, newStatus: string) => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: 'Новая', color: '#6b7280', icon: <Flag size={14} /> },
  in_progress: { label: 'В работе', color: '#3b82f6', icon: <Clock size={14} /> },
  on_hold: { label: 'На паузе', color: '#f59e0b', icon: <Clock size={14} /> },
  done: { label: 'Выполнена', color: '#10b981', icon: <CheckCircle size={14} /> },
  cancelled: { label: 'Отменена', color: '#ef4444', icon: <X size={14} /> },
  review: { label: 'На проверке', color: '#8b5cf6', icon: <AlertCircle size={14} /> },
  approval: { label: 'На согласовании', color: '#ec4899', icon: <AlertCircle size={14} /> },
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, onClose, onStatusChange }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-surface)' }}
      >
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Задача #{task.id}
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-opacity-50 transition-colors"
          style={{ background: 'var(--iris-bg-app)', color: 'var(--text-secondary)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Название и описание */}
        <div>
          <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{task.title}</h3>
          {task.description && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
          )}
        </div>

        {/* Статус */}
        <div className="p-3 rounded-lg"
          style={{ background: statusConfig[task.status].color + '15', border: `1px solid ${statusConfig[task.status].color}40` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span style={{ color: statusConfig[task.status].color }}>{statusConfig[task.status].icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {statusConfig[task.status].label}
            </span>
          </div>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="w-full px-2 py-1.5 rounded text-xs"
            style={{
              background: 'var(--iris-bg-app)',
              border: '1px solid var(--iris-border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            {Object.entries(statusConfig).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Приоритет */}
        <div className="flex items-center gap-2">
          <Flag size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Приоритет:</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {task.priority === 'critical' && '🔴 Критический'}
            {task.priority === 'high' && '🟠 Высокий'}
            {task.priority === 'normal' && '🔵 Средний'}
            {task.priority === 'low' && '⚪ Низкий'}
          </span>
        </div>

        {/* Исполнитель */}
        <div className="flex items-center gap-2">
          <User size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Исполнитель:</span>
          {task.assigneeName ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ background: 'var(--iris-accent-blue)', color: '#ffffff' }}
              >
                {task.assigneeName.charAt(0)}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.assigneeName}</span>
            </div>
          ) : (
            <span className="text-sm" style={{ color: 'var(--iris-accent-yellow)' }}>Не назначен</span>
          )}
        </div>

        {/* Проект */}
        {task.projectCode && (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Проект:</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {task.projectCode} {task.projectName && `- ${task.projectName}`}
            </span>
          </div>
        )}

        {/* Операция */}
        {task.operationName && (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Операция:</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {task.operationCode && `${task.operationCode} `}
              {task.operationName}
            </span>
          </div>
        )}

        {/* Документ */}
        {task.documentNumber && (
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Документ:</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.documentNumber}</span>
          </div>
        )}

        {/* Дедлайн */}
        <div className="flex items-center gap-2">
          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Дедлайн:</span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatDate(task.dueDate)}</span>
          {task.overdueDays !== null && task.overdueDays > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
              style={{ background: 'var(--iris-accent-red)', color: '#ffffff' }}
            >
              <AlertCircle size={12} />
              Просрочена на {task.overdueDays} дн.
            </span>
          )}
        </div>

        {/* Время */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Плановое</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {task.estimatedHours ? `${task.estimatedHours} ч.` : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Фактическое</div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {task.actualHours ? `${task.actualHours} ч.` : '—'}
            </div>
          </div>
        </div>

        {/* Прогресс */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Готовность</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.percentComplete}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--iris-bg-app)' }}>
            <div className="h-full rounded-full transition-all"
              style={{ 
                width: `${task.percentComplete}%`,
                background: task.status === 'done' ? 'var(--iris-accent-green)' : 'var(--iris-accent-blue)'
              }}
            />
          </div>
        </div>

        {/* Даты создания и обновления */}
        <div className="pt-4 border-t space-y-2" style={{ borderColor: 'var(--iris-border-subtle)' }}>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Создана: {formatDate(task.createdAt)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Обновлено: {formatDate(task.updatedAt)}
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-surface)' }}>
        <button className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110"
          style={{
            background: 'var(--iris-accent-blue)',
            color: '#ffffff',
            boxShadow: '0 0 12px var(--iris-glow-blue)',
          }}
        >
          Изменить задачу
        </button>
        <button className="w-full px-4 py-2 rounded-lg text-sm font-medium transition-all hover:brightness-110"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          Добавить комментарий
        </button>
      </div>
    </div>
  );
};
