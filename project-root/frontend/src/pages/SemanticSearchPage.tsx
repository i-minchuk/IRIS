import { SemanticSearchPanel } from '@/features/ai/components/SemanticSearchPanel';
import { Sparkles } from 'lucide-react';

export default function SemanticSearchPage() {
  return (
    <div className="h-full flex flex-col px-3 md:px-6 py-4 md:pt-2 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={20} style={{ color: 'var(--accent-ai)' }} />
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Семантический поиск
        </h1>
      </div>
      <div className="flex-1 border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
        <SemanticSearchPanel placeholder="Введите запрос на естественном языке..." />
      </div>
    </div>
  );
}
