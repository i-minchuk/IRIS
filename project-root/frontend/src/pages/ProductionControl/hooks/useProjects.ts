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

const MOCK_PROJECTS: ProductionProject[] = [
  {
    id: 'p-101', code: 'ПР-2026-101', name: 'Корпус редуктора РМ-500', customer: 'ООО «СтройГаз»',
    stage: 'production', status: 'on_track',
    plannedStart: '2026-01-15T00:00:00Z', plannedFinish: '2026-07-20T00:00:00Z', forecastFinish: '2026-07-18T00:00:00Z',
    progressPercent: 65, criticalPathDays: 28, contractSum: 12.5,
    routeId: 'route-101', currentOperation: 'Механическая обработка', currentWorkCenter: 'Мехобработка-1',
    nextMilestone: 'Сборка узла', nextMilestoneDate: '2026-06-25T00:00:00Z',
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'p-102', code: 'ПР-2026-102', name: 'Рама опорная РО-1200', customer: 'ПАО «Транснефть»',
    stage: 'production', status: 'at_risk',
    plannedStart: '2026-02-01T00:00:00Z', plannedFinish: '2026-08-10T00:00:00Z', forecastFinish: '2026-08-22T00:00:00Z',
    progressPercent: 40, criticalPathDays: 45, contractSum: 8.3,
    routeId: 'route-102', currentOperation: 'Сварка корпуса', currentWorkCenter: 'Сварочный участок',
    nextMilestone: 'ОТК / Контроль качества', nextMilestoneDate: '2026-07-05T00:00:00Z',
    createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'p-103', code: 'ПР-2026-103', name: 'Вал приводной ВП-80', customer: 'АО «Нефтемаш»',
    stage: 'production_prep', status: 'on_track',
    plannedStart: '2026-05-10T00:00:00Z', plannedFinish: '2026-09-15T00:00:00Z', forecastFinish: '2026-09-15T00:00:00Z',
    progressPercent: 15, criticalPathDays: 60, contractSum: 4.7,
    routeId: 'route-103', currentOperation: 'Подготовка деталей', currentWorkCenter: 'Склад готовой продукции',
    nextMilestone: 'Механическая обработка', nextMilestoneDate: '2026-06-30T00:00:00Z',
    createdAt: '2026-05-10T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'p-104', code: 'ПР-2026-104', name: 'Кожух защитный КЗ-45', customer: 'ООО «ПромСталь»',
    stage: 'production', status: 'delayed',
    plannedStart: '2026-03-01T00:00:00Z', plannedFinish: '2026-06-15T00:00:00Z', forecastFinish: '2026-07-10T00:00:00Z',
    progressPercent: 80, criticalPathDays: 12, contractSum: 3.2,
    routeId: 'route-104', currentOperation: 'Упаковка', currentWorkCenter: 'Упаковка',
    nextMilestone: 'Отгрузка', nextMilestoneDate: '2026-07-10T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z',
  },
];

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
        // Fallback to mock data when API returns empty list
        setProjects(transformed.length ? transformed : MOCK_PROJECTS);
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
