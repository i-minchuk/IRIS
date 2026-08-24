import client from '@/shared/api/client';
import type { PortfolioSummary } from '@/types';

export interface Project {
  id: number;
  name: string;
  code: string;
  status: string;
  customer_name?: string;
  manager_id?: number;
  contract_number?: string;
  stage?: string;
  risk_level?: 'low' | 'medium' | 'high';
  created_at?: string;
}

export interface ProjectTreeStage {
  id: number;
  name: string;
  code?: string;
  kits: ProjectTreeKit[];
}

export interface ProjectTreeKit {
  id: number;
  name: string;
  code?: string;
  sections: ProjectTreeSection[];
}

export interface ProjectTreeSection {
  id: number;
  name: string;
  code?: string;
  documents: ProjectTreeDoc[];
}

export interface ProjectTreeDoc {
  id: number;
  number: string;
  name: string;
  doc_type: string;
  status: string;
  crs_code?: string;
}

export interface ProjectTree {
  id: number;
  name: string;
  code: string;
  stages: ProjectTreeStage[];
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

export const projectsApi = {
  list: () => client.get<Project[]>('/projects'),
  get: (id: number) => client.get<Project>(`/projects/${id}`),
  create: (payload: Partial<Project>) => client.post<Project>('/projects', payload),
  getTree: (id: number) => client.get<ProjectTree>(`/projects/${id}/tree`),
};

// Legacy standalone exports (to be migrated)
export const getProjects = async (): Promise<Project[]> => {
  const { data } = await client.get('/projects', { params: { page_size: 100 } });
  // Backend возвращает пагинированный ответ { items, total, ... }
  return Array.isArray(data) ? data : (data?.items ?? []);
};

export const getProject = async (id: number): Promise<Project & { stages: Stage[] }> => {
  const { data } = await client.get(`/projects/${id}`);
  return data;
};

export const createProject = async (body: Partial<Project>): Promise<Project> => {
  const { data } = await client.post('/projects', body);
  return data;
};

export const createStage = async (projectId: number, body: Partial<Stage>): Promise<Stage> => {
  const { data } = await client.post(`/projects/${projectId}/stages`, body);
  return data;
};

export const createKit = async (stageId: number, body: Partial<Kit>): Promise<Kit> => {
  const { data } = await client.post(`/projects/stages/${stageId}/kits`, body);
  return data;
};

export const createSection = async (kitId: number, body: Partial<Section>): Promise<Section> => {
  const { data } = await client.post(`/projects/kits/${kitId}/sections`, body);
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
