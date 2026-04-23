import client from '@/shared/api/client';

export interface Variable {
  id: number;
  scope: string;
  project_id?: number;
  document_id?: number;
  key: string;
  value?: string;
  default_value?: string;
  description?: string;
  is_computed: boolean;
  computed_expression?: string;
}

export interface VariableRevision {
  id: number;
  variable_id: number;
  from_value?: string;
  to_value?: string;
  reason?: string;
  triggered_by?: string;
  created_at?: string;
}

export const variablesApi = {
  list: (params?: { scope?: string; project_id?: number }) =>
    client.get<Variable[]>('/variables', { params }),

  create: (payload: Partial<Variable>) =>
    client.post<Variable>('/variables', payload),

  update: (id: number, payload: Partial<Variable>) =>
    client.patch<Variable>(`/variables/${id}`, payload),

  substitute: (id: number, template: string) =>
    client.post<{ original: string; substituted: string; variable: string }>(
      `/variables/${id}/substitute`,
      { template }
    ),

  renderDocument: (documentId: number, extraVariables?: Record<string, string>) =>
    client.post<{ document_id: number; rendered: string; variables_snapshot?: Record<string, unknown> }>(
      `/documents/${documentId}/render`,
      { extra_variables: extraVariables }
    ),

  cascadeUpdate: (projectId: number, changedKeys: string[]) =>
    client.post<{ affected_documents: number; document_ids: number[] }>(
      '/documents/cascade-update',
      { project_id: projectId, changed_keys: changedKeys }
    ),
};
