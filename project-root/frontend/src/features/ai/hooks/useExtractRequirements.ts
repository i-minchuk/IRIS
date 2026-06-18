import { useState, useCallback } from 'react';
import { extractRequirements, type ExtractRequirementsResponse } from '@/features/ai/api/aiApi';
import { toast } from 'sonner';

export function useExtractRequirements() {
  const [result, setResult] = useState<ExtractRequirementsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const extract = useCallback(async (documentId: string) => {
    setLoading(true);
    try {
      const response = await extractRequirements(documentId);
      setResult(response);
      toast.success(`Извлечено ${response.requirements.length} требований`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка извлечения требований');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
  }, []);

  return { result, loading, extract, clear };
}
