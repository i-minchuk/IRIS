import type { KBArticle } from '@/types/support';
import { ChevronRight, ChevronDown, FileText, FolderOpen, Folder } from 'lucide-react';
import { useState } from 'react';

interface KBTreeProps {
  articles: KBArticle[];
  selectedCategory: string | null;
  onSelect: (category: string | null) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  onboarding: <FolderOpen size={16} />,
  documents: <FileText size={16} />,
  security: <Folder size={16} />,
  api: <Folder size={16} />,
  troubleshooting: <FolderOpen size={16} />,
  best_practices: <Folder size={16} />,
  faq: <FolderOpen size={16} />,
};

const CATEGORY_LABELS: Record<string, string> = {
  onboarding: 'Онбординг',
  documents: 'Документы',
  security: 'Безопасность',
  api: 'API',
  troubleshooting: 'Устранение неполадок',
  best_practices: 'Лучшие практики',
  faq: 'FAQ',
};

export function KBTree({ articles, selectedCategory, onSelect }: KBTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const categories = [...new Set(articles.map(a => a.category))];

  const toggleExpand = (cat: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === null ? 'font-medium' : ''}`}
        style={{
          backgroundColor: selectedCategory === null ? 'var(--bg-surface-2)' : 'transparent',
          color: selectedCategory === null ? 'var(--brand-iris)' : 'var(--text-primary)',
        }}
      >
        <FolderOpen size={16} />
        Все категории
        <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>{articles.length}</span>
      </button>

      {categories.map(category => {
        const count = articles.filter(a => a.category === category).length;
        const isExpanded = expanded.has(category);
        const isSelected = selectedCategory === category;

        return (
          <div key={category}>
            <button
              onClick={() => {
                toggleExpand(category);
                onSelect(category);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${isSelected ? 'font-medium' : ''}`}
              style={{
                backgroundColor: isSelected ? 'var(--bg-surface-2)' : 'transparent',
                color: isSelected ? 'var(--brand-iris)' : 'var(--text-primary)',
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {CATEGORY_ICONS[category] || <Folder size={16} />}
              {CATEGORY_LABELS[category] || category}
              <span className="ml-auto text-xs" style={{ color: 'var(--text-tertiary)' }}>{count}</span>
            </button>

            {isExpanded && (
              <div className="ml-6 space-y-1">
                {articles
                  .filter(a => a.category === category)
                  .map(article => (
                    <div
                      key={article.id}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <FileText size={12} />
                      <span className="truncate">{article.title}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
