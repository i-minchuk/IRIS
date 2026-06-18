import { useState, useCallback } from 'react';
import { analyzeDocument, type DocumentAnalysisResponse } from '@/features/ai/api/aiApi';
import { toast } from 'sonner';

export function useDocumentAnalysis() {
  const [result, setResult] = useState<DocumentAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = useCallback(async (documentId: string) => {
    setLoading(true);
    try {
      const response = await analyzeDocument(documentId);
      setResult(response);
      toast.success(`Анализ завершён: score ${response.overall_score}/100`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка анализа документа');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
  }, []);

  return { result, loading, analyze, clear };
}
