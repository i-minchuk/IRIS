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
  deadline?: string | null;
  is_delegated: boolean;
  signed_by: number | null;
  signed_at: string | null;
  signature_hash: string | null;
  assigned_users: { id: number; full_name: string }[];
  comments_count?: number;
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

export interface RoutingRule {
  id: number;
  name: string;
  project_id: number | null;
  project_name: string | null;
  doc_type: string | null;
  discipline: string | null;
  template_id: number;
  template_name: string | null;
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface RoutingRuleMatch {
  matched: boolean;
  rule: RoutingRule | null;
  template_id: number | null;
  template_name: string | null;
}

export interface MyTask {
  step_id: number;
  instance_id: number;
  template_name: string | null;
  document_id: number | null;
  document_name: string | null;
  step_name: string;
  approval_type: string;
  assignment_type: string;
  deadline: string | null;
  overdue_hours: number | null;
  assigned_at: string | null;
  is_delegated: boolean;
}

export interface DeadlineOverviewRow {
  step_id: number;
  instance_id: number;
  template_name: string | null;
  document_id: number | null;
  document_name: string | null;
  step_name: string;
  assignees: { id: number; full_name: string }[];
  assigned_at: string;
  deadline: string;
  deadline_hours: number;
  overdue_hours: number | null;
  hours_left: number | null;
}

export interface DeadlineOverview {
  total: number;
  overdue: number;
  rows: DeadlineOverviewRow[];
  /** Пунктуальность исполнителей по ключу user_id (строкой) */
  punctuality?: Record<
    string,
    { on_time: number; late: number; sent_on_time: number; sent_late: number }
  >;
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
  cancelInstance: (id: number) =>
    apiClient.post(`/workflows/instances/${id}/cancel`).then((r: any) => r.data),

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

  // Routing rules (сценарии маршрутизации)
  getRoutingRules: () =>
    apiClient.get('/workflows/routing-rules').then((r: any) => r.data.rules as RoutingRule[]),
  createRoutingRule: (data: {
    name: string;
    project_id?: number | null;
    doc_type?: string | null;
    discipline?: string | null;
    template_id: number;
    priority?: number;
    is_active?: boolean;
  }) => apiClient.post('/workflows/routing-rules', data).then((r: any) => r.data as RoutingRule),
  updateRoutingRule: (id: number, data: Partial<{
    name: string;
    project_id: number | null;
    doc_type: string | null;
    discipline: string | null;
    template_id: number;
    priority: number;
    is_active: boolean;
  }>) => apiClient.patch(`/workflows/routing-rules/${id}`, data).then((r: any) => r.data as RoutingRule),
  deleteRoutingRule: (id: number) => apiClient.delete(`/workflows/routing-rules/${id}`),
  matchRoutingRule: (params: { project_id?: number; doc_type?: string; discipline?: string }) =>
    apiClient.get('/workflows/routing-rules/match', { params }).then((r: any) => r.data as RoutingRuleMatch),

  // My pending approval tasks
  getMyTasks: () =>
    apiClient.get('/workflows/my-tasks').then((r: any) => r.data.tasks as MyTask[]),

  // Deadline overview for managers (analytics)
  getDeadlineOverview: () =>
    apiClient.get('/workflows/deadline-overview').then((r: any) => r.data as DeadlineOverview),

  // Template creation (конструктор маршрутов)
  createTemplate: (data: {
    name: string;
    code: string;
    description?: string;
    steps_schema: WorkflowStepSchema[];
  }) => apiClient.post('/workflows/templates', data).then((r: any) => r.data),
};
