import React from 'react';

export type FilterKey = 'severity' | 'status' | 'remark_type' | 'category';

export interface ActiveFilter {
  key: FilterKey;
  value: string;
  label: string;
  color: string;
}

interface Props {
  activeFilters: ActiveFilter[];
  onToggle: (filter: ActiveFilter) => void;
  onClear: () => void;
}

const TAGS: { key: FilterKey; value: string; label: string; color: string }[] = [
  // Severity
  { key: 'severity', value: 'critical', label: 'Критичное', color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'severity', value: 'major', label: 'Значительное', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'severity', value: 'minor', label: 'Незначительное', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'severity', value: 'note', label: 'Примечание', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700' },
  // Status
  { key: 'status', value: 'new', label: 'Новое', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'status', value: 'in_progress', label: 'В работе', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'status', value: 'resolved_pending', label: 'На проверке', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { key: 'status', value: 'closed', label: 'Закрыто', color: 'bg-green-100 text-green-700 border-green-200' },
  // Type
  { key: 'remark_type', value: 'customer', label: 'Заказчик', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { key: 'remark_type', value: 'internal', label: 'Внутреннее', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { key: 'remark_type', value: 'auditor', label: 'Аудитор', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  // Category
  { key: 'category', value: 'material', label: 'Материал', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { key: 'category', value: 'dimension', label: 'Размер', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { key: 'category', value: 'standard_violation', label: 'Норма', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { key: 'category', value: 'typo', label: 'Опечатка', color: 'bg-pink-100 text-pink-700 border-pink-200' },
];

export const RemarkFilters: React.FC<Props> = ({ activeFilters, onToggle, onClear }) => {
  const isActive = (tag: typeof TAGS[0]) =>
    activeFilters.some((f) => f.key === tag.key && f.value === tag.value);

  const groups = [
    { title: 'Срочность', items: TAGS.filter((t) => t.key === 'severity') },
    { title: 'Статус', items: TAGS.filter((t) => t.key === 'status') },
    { title: 'Источник', items: TAGS.filter((t) => t.key === 'remark_type') },
    { title: 'Категория', items: TAGS.filter((t) => t.key === 'category') },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Фильтры</h3>
        {activeFilters.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-600 hover:text-red-800">
            ❌ Очистить все
          </button>
        )}
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((f, i) => (
            <button
              key={i}
              onClick={() => onToggle(f)}
              className={`text-xs px-2 py-0.5 rounded-full border ${f.color} hover:opacity-80`}
            >
              {f.label} ✕
            </button>
          ))}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.title}>
          <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold mb-1">{group.title}</div>
          <div className="flex flex-wrap gap-1">
            {group.items.map((tag) => (
              <button
                key={`${tag.key}-${tag.value}`}
                onClick={() =>
                  onToggle({
                    key: tag.key,
                    value: tag.value,
                    label: tag.label,
                    color: tag.color,
                  })
                }
                className={`text-xs px-2 py-0.5 rounded-full border transition-opacity ${
                  isActive(tag) ? tag.color + ' ring-1 ring-offset-1 ring-gray-300' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
