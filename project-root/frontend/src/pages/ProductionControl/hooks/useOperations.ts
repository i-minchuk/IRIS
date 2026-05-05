import { useState, useEffect } from 'react';
import { Operation } from '../types/production';

export function useOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Operations are not yet available via API — return empty with loading done
    setOperations([]);
    setLoading(false);
  }, []);

  return { operations, loading, error };
}
