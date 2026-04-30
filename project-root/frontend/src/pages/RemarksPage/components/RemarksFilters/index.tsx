import React from 'react';
import { useRemarksStore } from '@/stores/remarksStore';
import { RemarkStatus, RemarkPriority, RemarkCategory, RemarkFilter } from '@/types/remarks';

export const RemarksFilters: React.FC = () => {
  const { filters, setFilters, resetFilters, tags } = useRemarksStore();

  const statusOptions: { value: RemarkStatus; label: string; color: string }[] = [
    { value: 'new', label: 'Новые', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'В работе', color: 'bg-yellow-500' },
    { value: 'resolved', label: 'Решённые', color: 'bg-green-500' },
    { value: 'rejected', label: 'Отклонённые', color: 'bg-red-500' },
    { value: 'deferred', label: 'Отложенные', color: 'bg-gray-500' },
    { value: 'closed', label: 'Закрытые', color: 'bg-purple-500' },
  ];

  const priorityOptions: { value: RemarkPriority; label: string; emoji: string }[] = [
    { value: 'critical', label: 'Критический', emoji: '🔴' },
    { value: 'high', label: 'Высокий', emoji: '🟠' },
    { value: 'medium', label: 'Средний', emoji: '🟡' },
    { value: 'low', label: 'Низкий', emoji: '🟢' },
  ];

  const categoryOptions: { value: RemarkCategory; label: string }[] = [
    { value: 'design_error', label: 'Ошибка проектирования' },
    { value: 'discrepancy', label: 'Несоответствие' },
    { value: 'incompleteness', label: 'Неполнота' },
    { value: 'norm_violation', label: 'Нарушение норм' },
    { value: 'customer_request', label: 'Запрос заказчика' },
    { value: 'other', label: 'Другое' },
  ];

  const toggleArrayFilter = (key: keyof RemarkFilter, value: string | number) => {
    const current = filters[key] as (string | number)[] | undefined;
    if (current?.includes(value)) {
      setFilters({ [key]: current.filter((v: string | number) => v !== value) } as Partial<RemarkFilter>);
    } else {
      setFilters({ [key]: [...(current || []), value] } as Partial<RemarkFilter>);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#e2e8f0]">Фильтры</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-[#3b82f6] hover:text-[#2563eb]"
        >
          Сбросить все
        </button>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {/* Search */}
        <div className="col-span-2">
          <label className="block text-xs text-[#94a3b8] mb-1">Поиск</label>
          <input
            type="text"
            placeholder="Название, описание..."
            value={filters.search_text || ''}
            onChange={(e) => setFilters({ search_text: e.target.value })}
            className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-xs text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none"
          />
        </div>

        {/* Project */}
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Проект</label>
          <select
            value={filters.project_id || ''}
            onChange={(e) => setFilters({ project_id: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-xs text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none"
          >
            <option value="">Все проекты</option>
            {/* TODO: Load projects from API */}
            <option value="1">Проект №1</option>
            <option value="2">Проект №2</option>
          </select>
        </div>

        {/* Document */}
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Документ</label>
          <select
            value={filters.document_id || ''}
            onChange={(e) => setFilters({ document_id: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-xs text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none"
          >
            <option value="">Все документы</option>
          </select>
        </div>

        {/* Assignee */}
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Назначено</label>
          <select
            value={filters.assignee_id || ''}
            onChange={(e) => setFilters({ assignee_id: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-xs text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none"
          >
            <option value="">Все пользователи</option>
            {/* TODO: Load users from API */}
            <option value="1">Иванов И.И.</option>
            <option value="2">Петров П.П.</option>
          </select>
        </div>
      </div>

      {/* Status chips */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-2">Статус</label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => toggleArrayFilter('status', status.value)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.status?.includes(status.value)
                  ? `${status.color} text-white`
                  : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority chips */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-2">Приоритет</label>
        <div className="flex flex-wrap gap-2">
          {priorityOptions.map((priority) => (
            <button
              key={priority.value}
              onClick={() => toggleArrayFilter('priority', priority.value)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.priority?.includes(priority.value)
                  ? 'bg-[#3b82f6] text-white'
                  : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
              }`}
            >
              <span>{priority.emoji}</span>
              {priority.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div>
        <label className="block text-xs text-[#94a3b8] mb-2">Категория</label>
        <div className="flex flex-wrap gap-2">
          {categoryOptions.map((category) => (
            <button
              key={category.value}
              onClick={() => toggleArrayFilter('category', category.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filters.category?.includes(category.value)
                  ? 'bg-[#9C27B0] text-white'
                  : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <label className="block text-xs text-[#94a3b8] mb-2">Теги</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleArrayFilter('tag_ids', tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors`}
                style={{
                  backgroundColor: filters.tag_ids?.includes(tag.id)
                    ? tag.color
                    : '#334155',
                  color: filters.tag_ids?.includes(tag.id) ? '#ffffff' : '#94a3b8',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Создано с</label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) => setFilters({ date_from: e.target.value })}
            className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-xs text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[#94a3b8] mb-1">Создано по</label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) => setFilters({ date_to: e.target.value })}
            className="w-full px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded text-xs text-[#e2e8f0] focus:border-[#3b82f6] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
