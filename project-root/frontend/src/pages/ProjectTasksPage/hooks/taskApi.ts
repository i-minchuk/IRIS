import apiClient from '@/shared/api/client';
import { Task, TaskCreateInput, TaskUpdateInput, TaskStatusUpdateInput, TaskStatistics } from '../types';

export const taskApi = {
  async getTasks(params: Record<string, any>): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks', { params });
    return response.data;
  },

  async getTask(taskId: number): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${taskId}`);
    return response.data;
  },

  async createTask(task: TaskCreateInput): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', task);
    return response.data;
  },

  async updateTask(taskId: number, task: TaskUpdateInput): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, task);
    return response.data;
  },

  async updateTaskStatus(taskId: number, status: TaskStatusUpdateInput): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}/status`, status);
    return response.data;
  },

  async deleteTask(taskId: number): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },

  async getStatistics(projectId?: number): Promise<TaskStatistics> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await apiClient.get<TaskStatistics>('/tasks/statistics', { params });
    return response.data;
  },

  async startTask(taskId: number): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/start`);
    return response.data;
  },

  async stopTask(taskId: number): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/stop`);
    return response.data;
  },

  async getTaskTime(taskId: number): Promise<{ task_id: number; total_seconds: number }> {
    const response = await apiClient.get<{ task_id: number; total_seconds: number }>(`/tasks/${taskId}/time`);
    return response.data;
  },
};
