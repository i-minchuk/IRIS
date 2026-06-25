import client from '@/shared/api/client';
import type { Task } from '@/types';

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

export interface WorkflowInstanceListResponse {
  instances: WorkflowInstance[];
  total: number;
  page: number;
  page_size: number;
}

export interface WorkflowTemplateListResponse {
  templates: WorkflowTemplate[];
  total: number;
}

/**
 * Get all workflow templates.
 * Endpoint: GET /workflows/templates
 */
export async function getWorkflowTemplates(): Promise<WorkflowTemplateListResponse> {
  const { data } = await client.get('/workflows/templates');
  return data;
}

/**
 * Get workflow instances with optional filters.
 * Endpoint: GET /workflows/instances
 */
export async function getWorkflowInstances(params?: {
  status?: string;
  document_id?: number;
  project_id?: number;
  my_tasks?: boolean;
  page?: number;
  page_size?: number;
}): Promise<WorkflowInstanceListResponse> {
  const { data } = await client.get('/workflows/instances', { params });
  return data;
}

/**
 * Start a workflow from a template.
 * Endpoint: POST /workflows/start
 */
export async function startWorkflow(
  templateId: number,
  documentId: number,
  launchComment?: string
): Promise<WorkflowInstance> {
  const { data } = await client.post('/workflows/start', {
    template_id: templateId,
    document_id: documentId,
    launch_comment: launchComment,
  });
  return data;
}

/**
 * Approve a workflow step.
 * Endpoint: POST /workflows/steps/{stepId}/approve
 */
export async function approveStep(stepId: number, comment?: string): Promise<unknown> {
  const { data } = await client.post(`/workflows/steps/${stepId}/approve`, { comment });
  return data;
}

/**
 * Reject a workflow step.
 * Endpoint: POST /workflows/steps/{stepId}/reject
 */
export async function rejectStep(stepId: number, reason: string): Promise<unknown> {
  const { data } = await client.post(`/workflows/steps/${stepId}/reject`, { reason });
  return data;
}

/**
 * Delegate a workflow step to another user.
 * Endpoint: POST /workflows/steps/{stepId}/delegate
 */
export async function delegateStep(stepId: number, userId: number): Promise<unknown> {
  const { data } = await client.post(`/workflows/steps/${stepId}/delegate`, { user_id: userId });
  return data;
}

/**
 * Add a comment to a workflow step.
 * Endpoint: POST /workflows/steps/{stepId}/comments
 */
export async function addComment(stepId: number, text: string): Promise<WorkflowComment> {
  const { data } = await client.post(`/workflows/steps/${stepId}/comments`, { text });
  return data;
}

/**
 * Get comments for a workflow step.
 * Endpoint: GET /workflows/steps/{stepId}/comments
 */
export async function getComments(stepId: number): Promise<WorkflowComment[]> {
  const { data } = await client.get(`/workflows/steps/${stepId}/comments`);
  return data;
}

/**
 * Adapt a WorkflowInstance to the Task type used by WorkflowPage.
 * Maps workflow status to task status and extracts relevant fields.
 */
export function adaptWorkflowInstanceToTask(instance: WorkflowInstance): Task {
  // Map workflow status to task status
  const statusMap: Record<string, string> = {
    active: 'IN_PROGRESS',
    completed: 'DONE',
    cancelled: 'DONE',
    rejected: 'DONE',
    draft: 'NEW',
  };

  // Determine priority from current step deadline
  let priority = 'NORMAL';
  const activeStep = instance.steps.find(s => s.status === 'pending' || s.status === 'in_progress');
  if (activeStep?.deadline) {
    const deadline = new Date(activeStep.deadline);
    const now = new Date();
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursLeft < 24) priority = 'HIGH';
    else if (hoursLeft > 72) priority = 'LOW';
  }

  return {
    id: instance.id,
    project_id: instance.project_id ?? 0,
    document_id: instance.document_id,
    type: 'workflow',
    title: instance.document_name
      ? `${instance.template_name}: ${instance.document_name}`
      : instance.template_name,
    description: instance.launch_comment,
    status: statusMap[instance.status] ?? 'NEW',
    priority,
    due_date: activeStep?.deadline ?? instance.completed_at ?? null,
    started_at: instance.started_at,
    completed_at: instance.completed_at,
    assignee_id: activeStep?.assigned_users?.[0]?.id ?? null,
    creator_id: instance.started_by ?? 0,
    planned_start: instance.started_at,
    planned_finish: activeStep?.deadline ?? null,
    planned_hours: activeStep?.deadline_hours ?? 0,
    actual_hours: 0,
    percent_complete: instance.status === 'completed' ? 100 : instance.status === 'active' ? 50 : 0,
    engineer: activeStep?.assigned_users?.[0]?.full_name ?? null,
    is_critical: priority === 'HIGH',
    es: null,
    ef: null,
    ls: null,
    lf: null,
    slack: null,
  };
}
