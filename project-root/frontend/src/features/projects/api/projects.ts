import client from '@/shared/api/client';

export interface Project {
  id: number;
  name: string;
  code: string;
  status: string;
  customer_name?: string;
  manager_id?: number;
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

export const projectsApi = {
  list: () => client.get<Project[]>('/projects'),
  get: (id: number) => client.get<Project>(`/projects/${id}`),
  create: (payload: Partial<Project>) => client.post<Project>('/projects', payload),
  getTree: (id: number) => client.get<ProjectTree>(`/projects/${id}/tree`),
};
