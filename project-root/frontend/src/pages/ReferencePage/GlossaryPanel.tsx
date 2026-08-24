import { useState, useMemo } from 'react';
import { Search, BookOpen, ChevronDown, ChevronUp, Library } from 'lucide-react';
import { GLOSSARY_DATA, type GlossaryDepartment, type GlossaryTerm } from './glossaryData';

interface GlossaryCardProps {
  term: GlossaryTerm;
  isDark: boolean;
}

function GlossaryCard({ term, isDark }: GlossaryCardProps) {
  return (
    <div
      className="rounded-xl p-4 transition-all hover:translate-y-[-2px]"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-default)',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className="text-base font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {term.term}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
          style={{
            background: 'rgba(20, 184, 166, 0.12)',
            color: '#14B8A6',
          }}
        >
          {term.whereFound}
        </span>
      </div>
      <p
        className="text-sm font-medium mb-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        {term.definition}
      </p>
      <p
        className="text-sm leading-relaxed"
        style={{ color: 'var(--text-muted)' }}
      >
        {term.companyUsage}
      </p>
    </div>
  );
}

interface DepartmentBlockProps {
  department: GlossaryDepartment;
  searchQuery: string;
  isDark: boolean;
  defaultOpen?: boolean;
}

function DepartmentBlock({
  department,
  searchQuery,
  isDark,
  defaultOpen = false,
}: DepartmentBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return department.terms;
    const q = searchQuery.toLowerCase();
    return department.terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        t.companyUsage.toLowerCase().includes(q) ||
        t.whereFound.toLowerCase().includes(q)
    );
  }, [department.terms, searchQuery]);

  if (filteredTerms.length === 0 && searchQuery.trim()) {
    return null;
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-default)',
      }}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
        style={{
          background: isOpen
            ? isDark
              ? 'rgba(20, 184, 166, 0.08)'
              : 'rgba(20, 184, 166, 0.04)'
            : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = isDark
              ? 'rgba(255,255,255,0.04)'
              : 'rgba(0,0,0,0.02)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        <div className="flex items-center gap-2">
          <BookOpen size={16} style={{ color: '#14B8A6' }} />
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {department.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'var(--iris-bg-hover)',
              color: 'var(--text-muted)',
            }}
          >
            {filteredTerms.length}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mt-2">
            {filteredTerms.map((term) => (
              <GlossaryCard key={term.term} term={term} isDark={isDark} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GlossaryPanelProps {
  isDark?: boolean;
}

export default function GlossaryPanel({ isDark = false }: GlossaryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const hasResults = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return GLOSSARY_DATA.some((dept) =>
      dept.terms.some(
        (t) =>
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          t.companyUsage.toLowerCase().includes(q) ||
          t.whereFound.toLowerCase().includes(q)
      )
    );
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg max-w-md"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-default)',
        }}
      >
        <Search size={14} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по терминам, определениям, использованию..."
          className="bg-transparent text-sm outline-none w-full"
          style={{ color: 'var(--text-primary)' }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs px-2 py-0.5 rounded transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            Очистить
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <Library size={14} />
          <span>{GLOSSARY_DATA.length} отделов</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen size={14} />
          <span>
            {GLOSSARY_DATA.reduce((sum, d) => sum + d.terms.length, 0)} терминов
          </span>
        </div>
      </div>

      {/* Departments */}
      {GLOSSARY_DATA.length === 0 ? (
        <div
          className="text-center py-12 text-sm rounded-xl"
          style={{
            color: 'var(--text-muted)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-default)',
          }}
        >
          Глоссарий пока пуст — термины будут добавлены позже
        </div>
      ) : !hasResults ? (
        <div
          className="text-center py-12 text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          Ничего не найдено по запросу «{searchQuery}»
        </div>
      ) : (
        <div className="space-y-3">
          {GLOSSARY_DATA.map((dept) => (
            <DepartmentBlock
              key={dept.id}
              department={dept}
              searchQuery={searchQuery}
              isDark={isDark}
              defaultOpen={!searchQuery.trim()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
