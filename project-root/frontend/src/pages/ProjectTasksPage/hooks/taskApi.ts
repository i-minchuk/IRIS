import apiClient from '@/shared/api/client';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStatusUpdateInput, TaskStatistics } from '../types';

export const taskApi = {
  async getTasks(params: Record<string, any>): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/api/v1/tasks', { params });
    return response.data;
  },

  async getTask(taskId: number): Promise<Task> {
    const response = await apiClient.get<Task>(`/api/v1/tasks/${taskId}`);
    return response.data;
  },

  async createTask(task: TaskCreateInput): Promise<Task> {
    const response = await apiClient.post<Task>('/api/v1/tasks', task);
    return response.data;
  },

  async updateTask(taskId: number, task: TaskUpdateInput): Promise<Task> {
    const response = await apiClient.patch<Task>(`/api/v1/tasks/${taskId}`, task);
    return response.data;
  },

  async updateTaskStatus(taskId: number, status: TaskStatusUpdateInput): Promise<Task> {
    const response = await apiClient.patch<Task>(`/api/v1/tasks/${taskId}/status`, status);
    return response.data;
  },

  async deleteTask(taskId: number): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}`);
  },

  async getStatistics(projectId?: number): Promise<TaskStatistics> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await apiClient.get<TaskStatistics>('/api/v1/tasks/statistics', { params });
    return response.data;
  },
};
