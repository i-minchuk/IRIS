import React, { useState, useRef } from 'react';
import { Search, X, Loader2, FileText, Sparkles } from 'lucide-react';
import { useSemanticSearch } from '@/features/ai/hooks/useSemanticSearch';
import type { SemanticSearchResult } from '@/features/ai/api/aiApi';

interface SemanticSearchPanelProps {
  documentId?: string;
  onResultClick?: (result: SemanticSearchResult) => void;
  placeholder?: string;
}

export const SemanticSearchPanel: React.FC<SemanticSearchPanelProps> = ({
  documentId,
  onResultClick,
  placeholder = 'Семантический поиск по документам...',
}) => {
  const { results, loading, query, search, clear } = useSemanticSearch();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(input, documentId);
  };

  const handleClear = () => {
    setInput('');
    clear();
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <form onSubmit={handleSubmit} className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-9 pr-9 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          />
          {input && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 mt-2">
          <Sparkles size={12} style={{ color: 'var(--accent-ai)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            AI-поиск по смыслу, не только по ключевым словам
          </span>
        </div>
      </form>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--accent-ai)' }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>AI ищет...</span>
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
            Ничего не найдено по запросу «{query}»
          </div>
        )}

        {results.map((result) => (
          <button
            key={result.chunk_id}
            onClick={() => onResultClick?.(result)}
            className="w-full text-left p-3 rounded-lg border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: 'var(--bg-surface-2)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} style={{ color: 'var(--accent-engineering)' }} />
              <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                {result.file_name}
              </span>
              <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
                {Math.round(result.score * 100)}%
              </span>
            </div>
            {result.section && (
              <div className="text-xs mb-1" style={{ color: 'var(--accent-ai)' }}>
                {result.section}
              </div>
            )}
            <p className="text-sm line-clamp-3" style={{ color: 'var(--text-primary)' }}>
              {result.text}
            </p>
            {result.page && (
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Стр. {result.page}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
