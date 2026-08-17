import { useState, useEffect } from 'react';
import { ProductionProject, ProductionStage } from '../types/production';
import { getProjects } from '@/features/projects/api/projects';

const statusMap: Record<string, ProductionProject['status']> = {
  draft: 'on_track',
  active: 'on_track',
  completed: 'on_track',
  archived: 'stopped',
  delayed: 'delayed',
  at_risk: 'at_risk',
};

const stageMap: Record<string, ProductionStage> = {
  draft: 'design',
  active: 'production',
  completed: 'shipment_ready',
  archived: 'shipped',
};

export function useProjects() {
  const [projects, setProjects] = useState<ProductionProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProjects();
        const list = (Array.isArray(data) ? data : ((data as any)?.items ?? [])) as any[];
        const transformed: ProductionProject[] = list.map((p) => ({
          id: String(p.id),
          code: p.code,
          name: p.name,
          customer: p.customer_name || '—',
          stage: stageMap[p.status] || 'design',
          status: statusMap[p.status] || 'on_track',
          plannedStart: p.created_at || '',
          plannedFinish: p.created_at || '',
          forecastFinish: p.created_at || '',
          progressPercent: 0,
          criticalPathDays: 0,
          contractSum: 0,
          routeId: '',
          createdAt: p.created_at || '',
          updatedAt: p.created_at || '',
        }));
        // Мок-фолбэк удалён: при пустом портфеле показываем честный empty-state
        setProjects(transformed);
        setError(null);
      } catch (err) {
        setError('Не удалось загрузить проекты');
        console.error(err);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { projects, loading, error };
}
