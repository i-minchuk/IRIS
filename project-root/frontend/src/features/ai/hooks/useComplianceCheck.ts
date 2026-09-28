import { useState, useCallback } from 'react';
import { checkCompliance, type ComplianceCheckResponse } from '@/features/ai/api/aiApi';
import { toast } from 'sonner';

export function useComplianceCheck() {
  const [result, setResult] = useState<ComplianceCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const runCheck = useCallback(async (documentId: string, requirements: string) => {
    if (!requirements.trim()) {
      toast.error('Введите требования для проверки');
      return;
    }
    setLoading(true);
    try {
      const response = await checkCompliance(documentId, requirements.trim());
      setResult(response);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка проверки соответствия');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
  }, []);

  return { result, loading, runCheck, clear };
}
