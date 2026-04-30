import { useState, useEffect } from 'react';
import { Operation } from '../types/production';
import { mockOperations } from '../mocks/productionData';

export function useOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 300));
      setOperations(mockOperations);
      setLoading(false);
    };
    load();
  }, []);

  return { operations, loading };
}
