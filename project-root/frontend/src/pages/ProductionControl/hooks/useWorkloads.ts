import { useState, useEffect } from 'react';
import { WorkCenter } from '../types/production';
import { mockWorkCenters } from '../mocks/productionData';

export function useWorkloads() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 300));
      setWorkCenters(mockWorkCenters);
      setLoading(false);
    };
    load();
  }, []);

  return { workCenters, loading };
}
