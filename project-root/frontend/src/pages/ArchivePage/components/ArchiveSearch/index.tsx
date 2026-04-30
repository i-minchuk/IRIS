// src/pages/ArchivePage/components/ArchiveSearch/index.tsx
import React, { useState, useEffect } from 'react';
import { useArchiveStore } from '../../store/archiveStore';
import { ArchiveEntryType } from '../../types/archive';

interface HighlightedTextProps {
  text: string;
  query: string;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, query }) => {
  if (!query || !text) return <span>{text}</span>;

  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-[#1e293b] px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const ArchiveSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<{
    entryTypes: ArchiveEntryType[];
    dateFrom: string;
    dateTo: string;
    hasAttachments: boolean;
  }>({
    entryTypes: [],
    dateFrom: '',
    dateTo: '',
    hasAttachments: false,
  });

  const { search, entries, isSearchLoading, currentFilters } = useArchiveStore();

  // Debounce поиска
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      if (query.trim() && currentFilters.projectId) {
        search(query.trim(), {
          entry_types: filters.entryTypes,
          date_from: filters.dateFrom || undefined,
          date_to: filters.dateTo || undefined,
          has_attachments: filters.hasAttachments,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, currentFilters.projectId]);

  const allEntryTypes: { value: ArchiveEntryType; label: string; icon: string }[] = [
    { value: 'document', label: 'Документы', icon: '📄' },
    { value: 'revision', label: 'Ревизии', icon: '🔄' },
    { value: 'remark', label: 'Замечания', icon: '💬' },
    { value: 'workflow', label: 'Согласования', icon: '✓' },
    { value: 'file_upload', label: 'Файлы', icon: '📎' },
    { value: 'material', label: 'Материалы', icon: '🧱' },
    { value: 'construction', label: 'Конструкции', icon: '🏗️' },
  ];

  const toggleFilter = (type: ArchiveEntryType) => {
    setFilters((prev) => ({
      ...prev,
      entryTypes: prev.entryTypes.includes(type)
        ? prev.entryTypes.filter((t) => t !== type)
        : [...prev.entryTypes, type],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по архиву..."
          className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6]"
        />
        {isSearchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3b82f6]" />
          </div>
        )}
      </div>

      {/* Фильтры */}
      <div className="flex flex-wrap gap-2">
        {allEntryTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => toggleFilter(type.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filters.entryTypes.includes(type.value)
                ? 'bg-[#3b82f6] text-white'
                : 'bg-[#334155] text-[#94a3b8] hover:bg-[#475569]'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      {/* Результаты */}
      {debouncedQuery && (
        <div className="space-y-2">
          <p className="text-sm text-[#94a3b8]">
            Найдено: {entries.length} записей{query && ` по запросу "${query}"`}
          </p>

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-3 bg-[#1e293b] border border-[#334155] rounded-lg hover:border-[#3b82f6] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-[#e2e8f0]">
                  <HighlightedText text={entry.title} query={debouncedQuery} />
                </h3>
                {entry.is_pinned && <span>📌</span>}
              </div>
              {entry.description && (
                <p className="text-sm text-[#94a3b8] mb-2">
                  <HighlightedText text={entry.description} query={debouncedQuery} />
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-[#64748b]">
                <span>{new Date(entry.occurred_at).toLocaleDateString('ru-RU')}</span>
                <span>•</span>
                <span className="capitalize">{entry.entry_type}</span>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-8 text-[#64748b]">
              <p>Ничего не найдено</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
