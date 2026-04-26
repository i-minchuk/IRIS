import client from './client';
import type { PortfolioSummary } from '../types';

export interface Project {
  id: number;
  name: string;
  code: string;
  customer_name?: string;
  contract_number?: string;
  stage?: string;
  status: string;
  risk_level?: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface Stage {
  id: number;
  project_id: number;
  name: string;
  code?: string;
  kits: Kit[];
}

export interface Kit {
  id: number;
  stage_id: number;
  name: string;
  code?: string;
  sections: Section[];
}

export interface Section {
  id: number;
  kit_id: number;
  name: string;
  code?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const { data } = await client.get('/api/v1/projects');
  return data;
};

export const getProject = async (id: number): Promise<Project & { stages: Stage[] }> => {
  const { data } = await client.get(`/api/v1/projects/${id}`);
  return data;
};

export const createProject = async (body: Partial<Project>): Promise<Project> => {
  const { data } = await client.post('/api/v1/projects', body);
  return data;
};

export const createStage = async (projectId: number, body: Partial<Stage>): Promise<Stage> => {
  const { data } = await client.post(`/api/v1/projects/${projectId}/stages`, body);
  return data;
};

export const createKit = async (stageId: number, body: Partial<Kit>): Promise<Kit> => {
  const { data } = await client.post(`/api/v1/projects/stages/${stageId}/kits`, body);
  return data;
};

export const createSection = async (kitId: number, body: Partial<Section>): Promise<Section> => {
  const { data } = await client.post(`/api/v1/projects/kits/${kitId}/sections`, body);
  return data;
};


export const getPortfolio = async (): Promise<{ summary: PortfolioSummary; projects: Project[] }> => {
  const projects = await getProjects();
  const active = projects.filter((p) => p.status === 'active').length;
  const at_risk = projects.filter((p) => p.risk_level === 'high').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  return {
    summary: { total: projects.length, active, at_risk, completed },
    projects,
  };
};
