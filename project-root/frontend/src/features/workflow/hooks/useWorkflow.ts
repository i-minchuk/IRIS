import { useState, useCallback } from 'react';
import { workflowApi, type WorkflowInstance, type WorkflowTemplate } from '../api/workflowApi';
import { toast } from 'sonner';

export function useWorkflow() {
  const [activeInstances, setActiveInstances] = useState<WorkflowInstance[]>([]);
  const [myTasks, setMyTasks] = useState<WorkflowInstance[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActive = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getInstances({ status: 'in_progress', page_size: 100 });
      setActiveInstances(res.instances);
    } catch {
      toast.error('Не удалось загрузить активные маршруты');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getInstances({ my_tasks: true, page_size: 100 });
      setMyTasks(res.instances);
    } catch {
      toast.error('Не удалось загрузить ваши задачи');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workflowApi.getTemplates();
      setTemplates(res.templates);
    } catch {
      toast.error('Не удалось загрузить шаблоны');
    } finally {
      setLoading(false);
    }
  }, []);

  const approveStep = useCallback(async (stepId: number, comment?: string) => {
    try {
      await workflowApi.approveStep(stepId, comment);
      toast.success('Шаг согласован');
      await Promise.all([fetchActive(), fetchMyTasks()]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка согласования');
    }
  }, [fetchActive, fetchMyTasks]);

  const rejectStep = useCallback(async (stepId: number, reason: string) => {
    try {
      await workflowApi.rejectStep(stepId, reason);
      toast.success('Шаг отклонён');
      await Promise.all([fetchActive(), fetchMyTasks()]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Ошибка отклонения');
    }
  }, [fetchActive, fetchMyTasks]);

  return {
    activeInstances,
    myTasks,
    templates,
    loading,
    fetchActive,
    fetchMyTasks,
    fetchTemplates,
    approveStep,
    rejectStep,
  };
}
