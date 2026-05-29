import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Task, TaskFilters, TaskStatistics } from '../types';
import { taskApi } from './taskApi';

export function useTasks(filters: TaskFilters, page: number, pageSize: number) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [taskTimers, setTaskTimers] = useState<Record<number, number>>({});

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, any> = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      if (filters.projectId) params.project_id = filters.projectId;
      if (filters.assigneeId) params.assignee_id = filters.assigneeId;
      if (filters.status) params.status = filters.status;
      if (filters.type) params.type = filters.type;
      if (filters.priority) params.priority = filters.priority;
      if (filters.workCenterId) params.work_center_id = filters.workCenterId;
      if (filters.dueDateFrom) params.due_date_from = filters.dueDateFrom;
      if (filters.dueDateTo) params.due_date_to = filters.dueDateTo;
      if (filters.overdueOnly) params.overdue_only = true;
      if (filters.search) params.search = filters.search;

      const [tasksResponse, statsResponse] = await Promise.all([
        taskApi.getTasks(params),
        taskApi.getStatistics(filters.projectId || undefined),
      ]);

      setTasks(tasksResponse);
      setStatistics(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки задач');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const refetch = useCallback(() => {
    fetchTasks();
  }, [fetchTasks]);

  const startTask = useCallback(async (taskId: number) => {
    const previousTasks = tasks;
    try {
      const updated = await taskApi.startTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: updated.status, startedAt: updated.startedAt } : t))
      );
      setActiveTaskId(taskId);
      const timeRes = await taskApi.getTaskTime(taskId);
      setTaskTimers((prev) => ({ ...prev, [taskId]: timeRes.total_seconds }));
      toast.success('Задача запущена');
    } catch (err) {
      setTasks(previousTasks);
      toast.error('Не удалось запустить задачу');
    }
  }, [tasks]);

  const stopTask = useCallback(async (taskId: number) => {
    const previousTasks = tasks;
    try {
      const updated = await taskApi.stopTask(taskId);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: updated.status, actualHours: updated.actualHours } : t))
      );
      setActiveTaskId((prev) => (prev === taskId ? null : prev));
      const timeRes = await taskApi.getTaskTime(taskId);
      setTaskTimers((prev) => ({ ...prev, [taskId]: timeRes.total_seconds }));
      toast.success('Задача остановлена');
    } catch (err) {
      setTasks(previousTasks);
      toast.error('Не удалось остановить задачу');
    }
  }, [tasks]);

  const updateTaskStatus = useCallback(async (taskId: number, newStatus: string) => {
    const previousTasks = tasks;
    const previousStats = statistics;

    // Optimistic update: update local state immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    );

    try {
      await taskApi.updateTaskStatus(taskId, { status: newStatus as Task['status'] });
      // Optional: refresh stats in background so counts stay accurate
      const freshStats = await taskApi.getStatistics(filters.projectId || undefined);
      setStatistics(freshStats);
    } catch (err) {
      // Rollback on error
      setTasks(previousTasks);
      setStatistics(previousStats);
      toast.error('Не удалось изменить статус задачи');
    }
  }, [tasks, statistics, filters.projectId]);

  return { tasks, statistics, loading, error, refetch, updateTaskStatus, startTask, stopTask, activeTaskId, taskTimers };
}
