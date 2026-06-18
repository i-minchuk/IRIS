import { useState, useCallback } from 'react';
import { semanticSearch, type SemanticSearchResult } from '@/features/ai/api/aiApi';
import { toast } from 'sonner';

export function useSemanticSearch() {
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const search = useCallback(async (q: string, documentId?: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setQuery(q);
    try {
      const response = await semanticSearch({
        query: q,
        top_k: 10,
        document_id: documentId,
      });
      setResults(response.results);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка семантического поиска');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setQuery('');
  }, []);

  return { results, loading, query, search, clear };
}
