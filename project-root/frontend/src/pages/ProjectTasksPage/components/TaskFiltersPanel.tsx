import React from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { TaskFilters, TaskType, TaskStatus, TaskPriority } from '../types';

interface TaskFiltersPanelProps {
  filters: TaskFilters;
  onFilterChange: (filters: Partial<TaskFilters>) => void;
}

export const TaskFiltersPanel: React.FC<TaskFiltersPanelProps> = ({ filters, onFilterChange }) => {
  const statuses: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'new', label: 'Новая', color: '#6b7280' },
    { value: 'in_progress', label: 'В работе', color: '#3b82f6' },
    { value: 'on_hold', label: 'На паузе', color: '#f59e0b' },
    { value: 'done', label: 'Выполнена', color: '#10b981' },
    { value: 'cancelled', label: 'Отменена', color: '#ef4444' },
  ];

  const priorities: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Низкий', color: '#6b7280' },
    { value: 'normal', label: 'Средний', color: '#3b82f6' },
    { value: 'high', label: 'Высокий', color: '#f59e0b' },
    { value: 'critical', label: 'Критический', color: '#ef4444' },
  ];

  const types: { value: TaskType; label: string; icon: string }[] = [
    { value: 'production', label: 'Производственная', icon: '🏭' },
    { value: 'document', label: 'Документ', icon: '📄' },
    { value: 'approval', label: 'Согласование', icon: '✅' },
    { value: 'review', label: 'Проверка', icon: '👀' },
    { value: 'issue', label: 'Проблема', icon: '⚠️' },
    { value: 'other', label: 'Другая', icon: '📌' },
  ];

  return (
    <div className="px-4 sm:px-6 py-3 border-b"
      style={{ background: 'var(--iris-bg-surface)', borderColor: 'var(--iris-border-subtle)' }}
    >
      <div className="flex flex-wrap gap-3">
        {/* Поиск */}
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="🔍 Поиск по названию задачи..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: 'var(--iris-bg-app)',
                border: '1px solid var(--iris-border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
        </div>

        {/* Фильтр по статусу */}
        <select
          value={filters.status || ''}
          onChange={(e) => onFilterChange({ status: e.target.value as TaskStatus || null })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Все статусы</option>
          {statuses.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Фильтр по типу */}
        <select
          value={filters.type || ''}
          onChange={(e) => onFilterChange({ type: e.target.value as TaskType || null })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Все типы</option>
          {types.map(t => (
            <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
          ))}
        </select>

        {/* Фильтр по приоритету */}
        <select
          value={filters.priority || ''}
          onChange={(e) => onFilterChange({ priority: e.target.value as TaskPriority || null })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Все приоритеты</option>
          {priorities.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {/* Фильтр по проекту */}
        <select
          value={filters.projectId || ''}
          onChange={(e) => onFilterChange({ projectId: e.target.value ? Number(e.target.value) : null })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Все проекты</option>
          {/* Сюда подгрузить проекты из API */}
          <option value="1">Проект 001</option>
          <option value="2">Проект 002</option>
        </select>

        {/* Фильтр по исполнителю */}
        <select
          value={filters.assigneeId || ''}
          onChange={(e) => onFilterChange({ assigneeId: e.target.value ? Number(e.target.value) : null })}
          className="px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <option value="">Все исполнители</option>
          {/* Сюда подгрузить пользователей из API */}
          <option value="1">Иванов И.И.</option>
          <option value="2">Петров П.П.</option>
        </select>

        {/* Только просроченные */}
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer select-none"
          style={{ background: filters.overdueOnly ? 'var(--iris-accent-red)' : 'var(--iris-bg-app)', color: filters.overdueOnly ? '#ffffff' : 'var(--text-secondary)' }}
        >
          <input
            type="checkbox"
            checked={filters.overdueOnly}
            onChange={(e) => onFilterChange({ overdueOnly: e.target.checked })}
            className="hidden"
          />
          <AlertCircle size={16} />
          <span className="text-sm">Просроченные</span>
        </label>

        {/* Сброс фильтров */}
        <button
          onClick={() => onFilterChange({
            projectId: null,
            assigneeId: null,
            status: null,
            type: null,
            priority: null,
            workCenterId: null,
            dueDateFrom: null,
            dueDateTo: null,
            overdueOnly: false,
            search: ''
          })}
          className="px-3 py-2 rounded-lg text-sm transition-all hover:brightness-110"
          style={{
            background: 'var(--iris-bg-app)',
            border: '1px solid var(--iris-border-subtle)',
            color: 'var(--text-secondary)',
          }}
        >
          Сброс
        </button>
      </div>
    </div>
  );
};
