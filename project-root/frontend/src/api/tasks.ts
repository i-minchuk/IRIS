import client from '@/shared/api/client';
import type { Task } from '../types';

export const getTodayTasks = async (): Promise<Task[]> => {
  const { data } = await client.get('/api/v1/tasks/today');
  return data;
};

export const getProjectTasks = async (projectId: number): Promise<Task[]> => {
  const { data } = await client.get(`/api/v1/tasks/project/${projectId}`);
  return data;
};

export const updateTaskStatus = async (id: number, status: string) => {
  const { data } = await client.put(`/api/v1/tasks/${id}/status`, { status });
  return data;
};

export const logTime = async (id: number, minutes: number) => {
  const { data } = await client.put(`/api/v1/tasks/${id}/log-time`, { minutes });
  return data;
};
