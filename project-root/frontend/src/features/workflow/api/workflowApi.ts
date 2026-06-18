import apiClient from '@/shared/api/client';

export interface WorkflowTemplate {
  id: number;
  name: string;
  code: string;
  description: string | null;
  steps_schema: WorkflowStepSchema[];
  is_active: boolean;
  is_default: boolean;
}

export interface WorkflowStepSchema {
  id: string;
  name: string;
  role: string | null;
  user_ids: number[] | null;
  assignment_type: string;
  approval_type: string;
  deadline_hours: number | null;
  auto_transition: Record<string, string> | null;
}

export interface WorkflowInstance {
  id: number;
  template_id: number;
  template_name: string;
  document_id: number | null;
  document_name: string | null;
  project_id: number | null;
  status: string;
  current_step_id: number | null;
  started_by: number | null;
  started_at: string | null;
  completed_at: string | null;
  launch_comment: string | null;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: number;
  step_key: string;
  step_name: string;
  role: string | null;
  assignment_type: string;
  approval_type: string;
  deadline_hours: number | null;
  order_index: number;
  status: string;
  is_delegated: boolean;
  signed_by: number | null;
  signed_at: string | null;
  signature_hash: string | null;
  assigned_users: { id: number; full_name: string }[];
}

export interface WorkflowSignature {
  id: number;
  step_id: number;
  user_id: number;
  user_name: string;
  signature_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  signed_at: string;
}

export interface WorkflowAuditLog {
  id: number;
  action: string;
  old_status?: string;
  new_status?: string;
  comment?: string;
  metadata?: Record<string, any>;
  user_id: number;
  user_name: string;
  timestamp: string;
}

export const workflowApi = {
  // Templates
  getTemplates: () => apiClient.get('/workflows/templates').then((r: any) => r.data.templates as WorkflowTemplate[]),
  getPredefinedTemplates: () => apiClient.get('/workflows/templates/predefined').then((r: any) => r.data as WorkflowTemplate[]),

  // Instances
  getInstances: (params?: { status?: string; my_tasks?: boolean }) =>
    apiClient.get('/workflows/instances', { params }).then((r: any) => r.data.instances as WorkflowInstance[]),
  getInstance: (id: number) => apiClient.get(`/workflows/instances/${id}`).then((r: any) => r.data as WorkflowInstance),
  getDocumentInstances: (documentId: number) =>
    apiClient.get(`/workflows/instances/document/${documentId}`).then((r: any) => r.data as WorkflowInstance[]),
  startWorkflow: (data: {
    template_id: number;
    document_id?: number;
    document_name?: string;
    project_id?: number;
    launch_comment?: string;
  }) => apiClient.post('/workflows/start', data).then((r: any) => r.data as WorkflowInstance),

  // Actions
  approveStep: (stepId: number, comment?: string) =>
    apiClient.post(`/workflows/steps/${stepId}/approve`, { comment }).then((r: any) => r.data),
  rejectStep: (stepId: number, reason: string, returnToAuthor?: boolean) =>
    apiClient.post(`/workflows/steps/${stepId}/reject`, { reason, return_to_author: returnToAuthor ?? true }).then((r: any) => r.data),
  delegateStep: (stepId: number, delegateTo: number, reason?: string) =>
    apiClient.post(`/workflows/steps/${stepId}/delegate`, { delegate_to: delegateTo, reason }).then((r: any) => r.data),
  signStep: (stepId: number, payload: { comment?: string; ip_address?: string; user_agent?: string }) =>
    apiClient.post(`/workflows/steps/${stepId}/sign`, payload).then((r: any) => r.data as { signature_hash: string; workflow_completed: boolean }),

  // Signatures
  getStepSignatures: (stepId: number) =>
    apiClient.get(`/workflows/steps/${stepId}/signatures`).then((r: any) => (r.data.signatures || []) as WorkflowSignature[]),

  // Audit
  getAuditLog: (instanceId: number) =>
    apiClient.get(`/workflows/audit/${instanceId}`).then((r: any) => r.data.logs || []),
};
