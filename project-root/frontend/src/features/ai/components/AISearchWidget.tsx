import React, { useState, useRef } from 'react';
import { Search, X, Loader2, FileText, Sparkles } from 'lucide-react';
import { useSemanticSearch } from '@/features/ai/hooks/useSemanticSearch';
import type { SemanticSearchResult } from '@/features/ai/api/aiApi';

interface AISearchWidgetProps {
  isDark?: boolean;
  compact?: boolean;
}

export const AISearchWidget: React.FC<AISearchWidgetProps> = ({ isDark: _isDark = false, compact = false }) => {
  const { results, loading, query, search, clear } = useSemanticSearch();
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    search(input);
    setIsExpanded(true);
  };

  const handleClear = () => {
    setInput('');
    clear();
    setIsExpanded(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (result: SemanticSearchResult) => {
    // Navigate to document detail
    window.open(`/documents/${result.document_id}`, '_blank');
  };

  return (
    <div className="w-full">
      {/* Header — скрываем в компактном режиме */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center h-8 w-8 rounded-lg"
              style={{ background: 'rgba(139, 92, 246, 0.12)' }}
            >
              <Sparkles size={16} style={{ color: '#8B5CF6' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              AI-поиск
            </h3>
          </div>
          {results.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {results.length} результатов
            </span>
          )}
        </div>
      )}

      {/* Search input */}
      <form onSubmit={handleSubmit} className="relative mb-3">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Поиск по смыслу..."
          className="w-full pl-9 pr-9 py-2 rounded-lg border text-xs focus:outline-none focus:ring-2 focus:ring-opacity-50"
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
            <X size={12} />
          </button>
        )}
      </form>

      {/* Hint — скрываем в компактном режиме */}
      {!compact && !isExpanded && !loading && results.length === 0 && (
        <div className="flex items-center gap-1 mb-2">
          <Sparkles size={10} style={{ color: 'var(--accent-ai)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            AI ищет по смыслу, не только по ключевым словам
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 size={14} className="animate-spin" style={{ color: '#8B5CF6' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>AI ищет...</span>
        </div>
      )}

      {/* Results — в компактном режиме ограничиваем высоту */}
      {!loading && results.length > 0 && (
        <div className={`space-y-2 overflow-y-auto ${compact ? 'max-h-[200px]' : 'max-h-[300px]'}`}>
          {results.slice(0, 5).map((result) => (
            <button
              key={result.chunk_id}
              onClick={() => handleResultClick(result)}
              className="w-full text-left p-2.5 rounded-lg border hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: 'var(--bg-surface-2)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText size={12} style={{ color: 'var(--accent-engineering)' }} />
                <span className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                  {result.file_name}
                </span>
                <span className="text-xs ml-auto" style={{ color: '#8B5CF6' }}>
                  {Math.round(result.score * 100)}%
                </span>
              </div>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                {result.text}
              </p>
            </button>
          ))}
          {results.length > 5 && (
            <button
              onClick={() => window.open('/ai-search', '_blank')}
              className="w-full text-center py-2 text-xs font-medium transition-colors"
              style={{ color: '#8B5CF6' }}
            >
              Все {results.length} результатов →
            </button>
          )}
        </div>
      )}

      {/* No results */}
      {!loading && query && results.length === 0 && (
        <div className="text-center py-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          Ничего не найдено
        </div>
      )}
    </div>
  );
};
