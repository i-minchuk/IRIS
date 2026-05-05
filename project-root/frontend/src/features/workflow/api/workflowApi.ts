import client from '@/shared/api/client';

export interface WorkflowTemplate {
  id: number;
  name: string;
  code: string;
  description: string | null;
  steps_schema: WorkflowStepSchema[];
  is_active: boolean;
  is_default: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepSchema {
  id: string;
  name: string;
  role: string | null;
  assignment_type: string;
  approval_type: string;
  deadline_hours: number | null;
  order_index: number;
}

export interface WorkflowInstance {
  id: number;
  template_id: number;
  template_name: string;
  document_id: number | null;
  document_revision: number | null;
  document_name: string | null;
  project_id: number | null;
  status: string;
  current_step_id: number | null;
  started_by: number | null;
  started_at: string | null;
  completed_at: string | null;
  launch_comment: string | null;
  document_changed: boolean;
  created_at: string;
  updated_at: string;
  steps: WorkflowStepInstance[];
}

export interface WorkflowStepInstance {
  id: number;
  step_key: string;
  step_name: string;
  role: string | null;
  assignment_type: string;
  approval_type: string;
  deadline_hours: number | null;
  order_index: number;
  status: string;
  deadline: string | null;
  assigned_users: { id: number; full_name: string }[];
  comments_count: number;
  is_delegated: boolean;
}

export interface WorkflowComment {
  id: number;
  text: string;
  page_number: number | null;
  coordinates: Record<string, unknown> | null;
  user_id: number;
  user_name: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowAuditLog {
  id: number;
  action: string;
  old_status: string | null;
  new_status: string | null;
  comment: string | null;
  metadata: Record<string, unknown> | null;
  user_id: number;
  user_name: string;
  timestamp: string;
}

export const workflowApi = {
  async getTemplates(): Promise<{ templates: WorkflowTemplate[]; total: number }> {
    const { data } = await client.get('/api/v1/workflows/templates');
    return data;
  },

  async getInstances(params?: {
    status?: string;
    document_id?: number;
    project_id?: number;
    my_tasks?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ instances: WorkflowInstance[]; total: number; page: number; page_size: number }> {
    const { data } = await client.get('/api/v1/workflows/instances', { params });
    return data;
  },

  async getInstance(instanceId: number): Promise<WorkflowInstance> {
    const { data } = await client.get(`/api/v1/workflows/instances/${instanceId}`);
    return data;
  },

  async getDocumentInstances(documentId: number): Promise<WorkflowInstance[]> {
    const { data } = await client.get(`/api/v1/workflows/instances/document/${documentId}`);
    return data;
  },

  async getStepComments(stepId: number): Promise<WorkflowComment[]> {
    const { data } = await client.get(`/api/v1/workflows/steps/${stepId}/comments`);
    return data;
  },

  async approveStep(stepId: number, comment?: string): Promise<unknown> {
    const { data } = await client.post(`/api/v1/workflows/steps/${stepId}/approve`, { comment });
    return data;
  },

  async rejectStep(stepId: number, reason: string): Promise<unknown> {
    const { data } = await client.post(`/api/v1/workflows/steps/${stepId}/reject`, { reason });
    return data;
  },

  async getAuditLog(instanceId: number): Promise<{ logs: WorkflowAuditLog[]; total: number }> {
    const { data } = await client.get(`/api/v1/workflows/audit/${instanceId}`);
    return data;
  },
};
