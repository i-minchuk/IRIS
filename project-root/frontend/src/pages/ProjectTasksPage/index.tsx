import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Task, TaskFilters } from './types';
import { useTasks } from './hooks/useTasks';
import { TaskFiltersPanel } from './components/TaskFiltersPanel';
import { TaskTable } from './components/TaskTable';
import { TaskStatisticsPanel } from './components/TaskStatisticsPanel';
import { TaskDetailPanel } from './components/TaskDetailPanel';

export const ProjectTasksPage: React.FC = () => {
  const [filters, setFilters] = useState<TaskFilters>({
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
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { tasks, loading, statistics, error, refetch } = useTasks(filters, page, pageSize);

  const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1); // Сброс на первую страницу при изменении фильтров
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleStatusChange = (_taskId: number, _newStatus: string) => {
    // Обновление статуса через API
    refetch(); // Перезагрузка после изменения
  };

  return (
    <div className="h-[calc(100vh-180px)] min-h-[600px] flex flex-col" 
      style={{ background: 'var(--iris-bg-app)', color: 'var(--text-primary)' }}
    >
      {/* Заголовок страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-3"
        style={{ background: 'var(--iris-bg-surface)', borderBottom: '1px solid var(--iris-border-subtle)' }}
      >
        <div>
          <h1 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            📋 Задачи по проектам
          </h1>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Единый список задач по всем проектам с привязкой к операциям и документам
          </p>
        </div>

        {/* Быстрые действия */}
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110 flex items-center gap-2"
            style={{
              background: 'var(--iris-bg-app)',
              border: '1px solid var(--iris-border-subtle)',
              color: 'var(--text-secondary)',
            }}
            onClick={() => refetch()}
          >
            🔄 Обновить
          </button>
          <button
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:brightness-110 flex items-center gap-2"
            style={{
              background: 'var(--iris-accent-blue)',
              color: '#ffffff',
              boxShadow: '0 0 12px var(--iris-glow-blue)',
            }}
          >
            ➕ Создать задачу
          </button>
        </div>
      </div>

      {/* Панель фильтров */}
      <TaskFiltersPanel
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Статистика */}
      {statistics && (
        <TaskStatisticsPanel statistics={statistics} />
      )}

      {/* Основной контент */}
      <div className="flex-1 overflow-hidden flex">
        {/* Таблица задач */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--iris-accent-blue)' }}></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              <AlertCircle className="mr-2" size={20} />
              {error}
            </div>
          ) : (
            <TaskTable
              tasks={tasks}
              selectedTask={selectedTask}
              onSelectTask={handleTaskSelect}
              onStatusChange={handleStatusChange}
              onPageChange={setPage}
              currentPage={page}
              pageSize={pageSize}
              totalCount={statistics?.total || 0}
            />
          )}
        </div>

        {/* Правая панель — карточка задачи */}
        {selectedTask && (
          <div className="w-96 border-l overflow-y-auto hidden xl:block"
            style={{ borderColor: 'var(--iris-border-subtle)', background: 'var(--iris-bg-surface)' }}
          >
            <TaskDetailPanel
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
