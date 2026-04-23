import client from '@/shared/api/client';

export interface DocumentNode {
  id: number;
  number: string;
  name: string;
  doc_type: string;
  status: string;
  planned_start?: string;
  planned_end?: string;
  actual_start?: string;
  actual_end?: string;
  duration_hours?: number;
}

export interface DependencyEdge {
  id: number;
  source: number;
  target: number;
  dependency_type: string;
  lag_hours: number;
}

export interface DependencyGraph {
  project_id: number;
  nodes: DocumentNode[];
  edges: DependencyEdge[];
}

export interface CreateDependencyPayload {
  project_id: number;
  source_document_id: number;
  target_document_id: number;
  dependency_type?: string;
  lag_hours?: number;
}

export const dependenciesApi = {
  getGraph: (projectId: number) =>
    client.get<DependencyGraph>(`/documents/dependencies/graph?project_id=${projectId}`),

  list: (projectId?: number) =>
    client.get<DependencyEdge[]>('/documents/dependencies', { params: projectId ? { project_id: projectId } : undefined }),

  create: (payload: CreateDependencyPayload) =>
    client.post<DependencyEdge>('/documents/dependencies', payload),

  remove: (id: number) =>
    client.delete(`/documents/dependencies/${id}`),
};
