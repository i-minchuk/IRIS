import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen, ChevronDown, ChevronUp, Library, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchGlossaryTerms,
  generateGlossary,
  deleteGlossaryTerm,
  type GlossaryTerm,
} from './glossaryApi';

interface GlossaryCardProps {
  term: GlossaryTerm;
  isDark: boolean;
  onDelete?: (id: number) => void;
}

function GlossaryCard({ term, isDark, onDelete }: GlossaryCardProps) {
  return (
    <div
      className="rounded-xl p-4 transition-all hover:translate-y-[-2px] relative group"
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--border-default)',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {onDelete && (
        <button
          onClick={() => onDelete(term.id)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
          style={{ color: 'var(--text-muted)' }}
          title="Удалить"
        >
          <Trash2 size={14} />
        </button>
      )}
      <div className="flex items-start justify-between gap-3 mb-2 pr-6">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          {term.term}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
          style={{
            background: 'rgba(20, 184, 166, 0.12)',
            color: '#14B8A6',
          }}
        >
          {term.department || 'Общие'}
        </span>
      </div>
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
        {term.definition}
      </p>
      {term.company_usage && (
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--text-muted)' }}>
          {term.company_usage}
        </p>
      )}
      {term.where_found && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Источник: {term.where_found}
        </p>
      )}
    </div>
  );
}

interface DepartmentBlockProps {
  name: string;
  terms: GlossaryTerm[];
  searchQuery: string;
  isDark: boolean;
  defaultOpen?: boolean;
  onDelete?: (id: number) => void;
}

function DepartmentBlock({
  name,
  terms,
  searchQuery,
  isDark,
  defaultOpen = false,
  onDelete,
}: DepartmentBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const filteredTerms = useMemo(() => {
    if (!searchQuery.trim()) return terms;
    const q = searchQuery.toLowerCase();
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.company_usage?.toLowerCase().includes(q) ?? false) ||
        (t.where_found?.toLowerCase().includes(q) ?? false) ||
        (t.department?.toLowerCase().includes(q) ?? false)
    );
  }, [terms, searchQuery]);

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
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {name}
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
              <GlossaryCard key={term.id} term={term} isDark={isDark} onDelete={onDelete} />
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
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadTerms = async () => {
    setLoading(true);
    try {
      const data = await fetchGlossaryTerms();
      setTerms(data);
    } catch (err) {
      console.error('Failed to load glossary:', err);
      toast.error('Не удалось загрузить глоссарий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTerms();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateGlossary();
      toast.success(`Сгенерировано терминов: ${result.generated}`);
      await loadTerms();
    } catch (err: any) {
      console.error('Failed to generate glossary:', err);
      const message = err?.response?.data?.detail || 'Не удалось сгенерировать глоссарий';
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteGlossaryTerm(id);
      setTerms((prev) => prev.filter((t) => t.id !== id));
      toast.success('Термин удалён');
    } catch (err) {
      console.error('Failed to delete term:', err);
      toast.error('Не удалось удалить термин');
    }
  };

  const departments = useMemo(() => {
    const groups = new Map<string, GlossaryTerm[]>();
    terms.forEach((term) => {
      const key = term.department || 'Общие';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(term);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [terms]);

  const hasResults = useMemo(() => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return terms.some(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q) ||
        (t.company_usage?.toLowerCase().includes(q) ?? false) ||
        (t.where_found?.toLowerCase().includes(q) ?? false) ||
        (t.department?.toLowerCase().includes(q) ?? false)
    );
  }, [terms, searchQuery]);

  const totalTerms = terms.length;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg max-w-md w-full"
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

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 shrink-0"
          style={{ background: '#14B8A6', color: '#FFFFFF' }}
          onMouseEnter={(e) => {
            if (!generating) e.currentTarget.style.backgroundColor = '#0D9488';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#14B8A6';
          }}
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {generating ? 'Генерация…' : 'Сгенерировать из документации'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <Library size={14} />
          <span>{departments.length} отделов</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen size={14} />
          <span>{totalTerms} терминов</span>
        </div>
      </div>

      {/* Departments */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Loader2 size={20} className="animate-spin mr-2" /> Загрузка глоссария…
        </div>
      ) : terms.length === 0 ? (
        <div
          className="text-center py-12 text-sm rounded-xl"
          style={{
            color: 'var(--text-muted)',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-default)',
          }}
        >
          Глоссарий пока пуст. Нажмите «Сгенерировать из документации», чтобы извлечь термины из документации с помощью AI.
        </div>
      ) : !hasResults ? (
        <div className="text-center py-12 text-sm" style={{ color: 'var(--text-muted)' }}>
          Ничего не найдено по запросу «{searchQuery}»
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map(([name, deptTerms]) => (
            <DepartmentBlock
              key={name}
              name={name}
              terms={deptTerms}
              searchQuery={searchQuery}
              isDark={isDark}
              defaultOpen={!searchQuery.trim()}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
