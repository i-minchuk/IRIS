import { useState } from 'react';
import { Card } from '@/components/ui';
import { Input } from '@/components/ui';
import { useSupportStore } from '@/stores/supportStore';
import { KBTree } from '@/components/admin/KBTree';
import { Search, Eye, ThumbsUp, FileText } from 'lucide-react';

export default function KnowledgeBasePage() {
  const articles = useSupportStore(s => s.kbArticles);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = articles.filter(a => {
    const matchesCategory = selectedCategory === null || a.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div>
        <h1 className="sr-only sr-only" style={{ color: 'var(--text-primary)' }}>
          База знаний
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Документация, руководства и FAQ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <Card padding="md" className="lg:col-span-1">
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Категории</h3>
          <KBTree
            articles={articles}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по статьям..."
              className="pl-9"
            />
          </div>

          <div className="space-y-3">
            {filtered.map(article => (
              <Card key={article.id} padding="md" className="cursor-pointer hover:opacity-90 transition-opacity">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={18} style={{ color: 'var(--brand-iris)' }} />
                    <div>
                      <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>{article.title}</h3>
                      <p className="text-sm line-clamp-2 mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {article.content.substring(0, 120)}...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-surface-2)' }}>
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {article.views}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} /> {article.helpful_count}
                  </span>
                  <span>{article.author}</span>
                  <span>{new Date(article.updated_at).toLocaleDateString('ru-RU')}</span>
                </div>

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {article.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
