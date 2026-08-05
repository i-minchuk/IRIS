import { useEffect, useRef, useState, useMemo } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { useGlobalSearchStore, SearchScope } from '@/stores/globalSearchStore';

const TAB_PLACEHOLDERS: Record<string, string> = {
  '/portfolio': 'Поиск по проекту, заказчику…',
  '/production': 'Поиск по проекту, заказчику…',
  '/archive': 'Поиск в архиве…',
  '/documents': 'Поиск по документам…',
  '/admin': 'Поиск в администрировании…',
  '/references': 'Поиск в справочниках…',
  '/reports': 'Поиск в отчётах…',
  '/dashboard': 'Поиск по аналитике…',
};

export default function GlobalSearch() {
  const { query, scope, activeTab, setQuery, setScope } = useGlobalSearchStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scopeOptions = useMemo(
    () => [
      { value: 'current' as SearchScope, label: 'Текущая вкладка' },
      { value: 'everywhere' as SearchScope, label: 'Везде' },
      { value: 'project' as SearchScope, label: 'По проекту / заказчику' },
    ],
    []
  );

  const currentScope = scopeOptions.find((s) => s.value === scope) || scopeOptions[0];

  const placeholder = useMemo(() => {
    if (scope === 'project') return 'Поиск по проекту / заказчику…';
    if (scope === 'everywhere') return 'Поиск по всему приложению…';
    return activeTab ? (TAB_PLACEHOLDERS[activeTab] || 'Поиск') : 'Поиск';
  }, [scope, activeTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setQuery('');
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setQuery]);

  const handleSelect = (value: SearchScope) => {
    setScope(value);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-center w-full rounded-lg border transition-colors overflow-hidden"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
      >
        <Search
          size={14}
          className="shrink-0 ml-2.5 pointer-events-none"
          style={{ color: 'var(--text-muted)' }}
        />
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="shrink-0 flex items-center gap-1 px-2 py-1.5 text-xs transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          title="Область поиска"
        >
          <span className="hidden sm:inline max-w-[100px] truncate">{currentScope.label}</span>
          <ChevronDown
            size={12}
            className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        <div className="w-px h-4 shrink-0" style={{ background: 'var(--border-default)' }} />
        <input
          ref={inputRef}
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          title="Глобальный поиск (Ctrl+K)"
          className="flex-1 min-w-0 bg-transparent px-2 py-1.5 text-xs outline-none"
          style={{ color: 'var(--text-primary)' }}
          onFocus={(e) => {
            e.currentTarget.parentElement!.style.borderColor = 'var(--accent-engineering)';
          }}
          onBlur={(e) => {
            e.currentTarget.parentElement!.style.borderColor = 'var(--border-default)';
          }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="shrink-0 mr-2 rounded p-0.5 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            aria-label="Очистить поиск"
          >
            <X size={10} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute left-0 mt-1 min-w-[200px] max-w-[260px] rounded-lg border shadow-lg py-1 z-50"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            boxShadow: 'var(--iris-shadow-lg)',
          }}
          role="listbox"
        >
          {scopeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === scope}
              onClick={() => handleSelect(option.value)}
              className="w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between"
              style={{
                color: 'var(--text-primary)',
                background: option.value === scope ? 'var(--iris-bg-hover)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--iris-bg-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  option.value === scope ? 'var(--iris-bg-hover)' : 'transparent';
              }}
            >
              <span>{option.label}</span>
              {option.value === scope && (
                <span className="text-[10px]" style={{ color: 'var(--accent-engineering)' }}>
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
