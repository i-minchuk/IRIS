import client from './client';
import type { ProjectHealth, EngineerSPI } from '../types';

export const getProjectHealth = async (id: number): Promise<ProjectHealth> => {
  const { data } = await client.get(`/api/dashboard/project/${id}`);
  return data;
};

export const getEngineerSPI = async (projectId: number): Promise<EngineerSPI[]> => {
  const { data } = await client.get(`/api/dashboard/project/${projectId}/engineers`);
  return data;
};

export const getDocTypeSPI = async (projectId: number) => {
  const { data } = await client.get(`/api/dashboard/project/${projectId}/doc-types`);
  return data;
};
