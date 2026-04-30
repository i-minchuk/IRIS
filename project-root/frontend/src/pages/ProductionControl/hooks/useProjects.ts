import { useState, useEffect } from 'react';
import { ProductionProject } from '../types/production';
import { mockProjects } from '../mocks/productionData';

export function useProjects() {
  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // TODO: replace with real API call
        // const data = await fetch('/api/production/projects').then(r => r.json());
        await new Promise(r => setTimeout(r, 300));
        setProjects(mockProjects);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить проекты');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { projects, loading, error };
}
