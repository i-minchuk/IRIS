// src/pages/ArchivePage/components/SearchBar/index.tsx
import React, { useState, useCallback } from 'react';
import { ArchiveEntryType } from '../../types/archive';

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

interface SearchFilters {
  entryTypes: ArchiveEntryType[];
  dateFrom?: string;
  dateTo?: string;
  hasAttachments: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    entryTypes: [],
    hasAttachments: false,
  });

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

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      onSearch(query.trim(), filters);
    }
  }, [query, filters, onSearch]);

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 mb-4">
      {/* Поиск */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Поиск по архиву..."
          className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-[#e2e8f0] placeholder-[#64748b] focus:outline-none focus:border-[#3b82f6]"
        />
        <button
          onClick={handleSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#3b82f6] rounded-lg hover:bg-[#2563eb] transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Фильтры по типам */}
      <div className="flex flex-wrap gap-2 mb-4">
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

      {/* Дополнительные фильтры */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-[#94a3b8]">
          <input
            type="checkbox"
            checked={filters.hasAttachments}
            onChange={(e) => setFilters((prev) => ({ ...prev, hasAttachments: e.target.checked }))}
            className="w-4 h-4 rounded border-[#334155] bg-[#0f172a]"
          />
          Только с вложениями
        </label>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            className="px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-sm text-[#e2e8f0]"
          />
          <span className="text-[#64748b]">—</span>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            className="px-3 py-1.5 bg-[#0f172a] border border-[#334155] rounded-lg text-sm text-[#e2e8f0]"
          />
        </div>
      </div>
    </div>
  );
};
