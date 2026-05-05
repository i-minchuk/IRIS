import { useState, useEffect } from 'react';
import { WorkCenter } from '../types/production';
import { resourcesApi } from '@/features/resources/api/resources';

export function useWorkloads() {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await resourcesApi.getHeatmap();
        // Transform heatmap departments into work centers
        const centers: WorkCenter[] = data.departments.flatMap((dept) =>
          dept.employees.map((emp) => ({
            id: String(emp.id),
            code: `${dept.dept.slice(0, 3).toUpperCase()}-${emp.id}`,
            name: `${emp.name} (${dept.dept})`,
            department: dept.dept,
            capacity: 100,
            plannedLoad: emp.load,
            actualLoad: emp.load,
            utilization: emp.load,
            activeProjects: emp.projects.length,
            overdueOperations: 0,
          }))
        );
        setWorkCenters(centers);
      } catch (err) {
        setError('Не удалось загрузить загрузку');
        setWorkCenters([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { workCenters, loading, error };
}
