/** Remark types for issue tracking system */

export type RemarkSource = 
  | 'internal'
  | 'customer'
  | 'regulatory'
  | 'workflow'
  | 'audit'
  | 'manual';

export type RemarkStatus = 
  | 'new'
  | 'in_progress'
  | 'resolved'
  | 'rejected'
  | 'deferred'
  | 'closed';

export type RemarkPriority = 
  | 'critical'
  | 'high'
  | 'medium'
  | 'low';

export type RemarkCategory = 
  | 'design_error'
  | 'discrepancy'
  | 'incompleteness'
  | 'norm_violation'
  | 'customer_request'
  | 'other';

export interface RemarkHistoryEntry {
  action: string;
  user_id: number;
  user_name: string;
  timestamp: string;
  old_status?: string;
  new_status?: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface RemarkAttachment {
  filename: string;
  url: string;
  uploaded_at: string;
  uploaded_by?: number;
}

export interface RemarkComment {
  id: number;
  remark_id: string;
  author_id: number;
  author_name: string;
  text: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

export interface RemarkTag {
  id: number;
  name: string;
  color: string;
}

export interface Remark {
  id: string;
  project_id?: number;
  project_name?: string;
  document_id?: number;
  document_name?: string;
  revision_id?: number;
  workflow_step_id?: number;
  
  source: RemarkSource;
  status: RemarkStatus;
  priority: RemarkPriority;
  category: RemarkCategory;
  
  title: string;
  description: string;
  location_ref?: string;
  
  author_id: number;
  author_name: string;
  assignee_id?: number;
  assignee_name?: string;
  
  due_date?: string;
  resolution?: string;
  resolved_by?: number;
  resolved_by_name?: string;
  resolved_at?: string;
  
  parent_id?: string;
  related_remark_ids: string[];
  
  attachments: RemarkAttachment[];
  history: RemarkHistoryEntry[];
  
  tags: number[];
  comments_count: number;
  
  created_at: string;
  updated_at: string;
}

export interface RemarkListItem {
  id: string;
  title: string;
  status: RemarkStatus;
  priority: RemarkPriority;
  category: RemarkCategory;
  
  project_id?: number;
  project_name?: string;
  document_id?: number;
  document_name?: string;
  
  author_id: number;
  author_name: string;
  assignee_id?: number;
  assignee_name?: string;
  
  due_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface RemarkFilter {
  project_id?: number;
  document_id?: number;
  status?: RemarkStatus[];
  priority?: RemarkPriority[];
  category?: RemarkCategory[];
  source?: RemarkSource[];
  assignee_id?: number;
  author_id?: number;
  
  date_from?: string;
  date_to?: string;
  
  search_text?: string;
  tag_ids?: number[];
  
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  
  page: number;
  page_size: number;
}

export interface RemarkStatistics {
  total: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_category: Record<string, number>;
  by_source: Record<string, number>;
  
  overdue_count: number;
  my_open_count: number;
  
  avg_resolution_time_hours?: number;
}

export interface RemarkCreateInput {
  project_id?: number;
  document_id?: number;
  revision_id?: number;
  workflow_step_id?: number;
  
  source: RemarkSource;
  priority: RemarkPriority;
  category: RemarkCategory;
  
  title: string;
  description: string;
  location_ref?: string;
  
  assignee_id?: number;
  due_date?: string;
  tag_ids?: number[];
}

export interface RemarkUpdateInput {
  project_id?: number;
  document_id?: number;
  revision_id?: number;
  
  source?: RemarkSource;
  status?: RemarkStatus;
  priority?: RemarkPriority;
  category?: RemarkCategory;
  
  title?: string;
  description?: string;
  location_ref?: string;
  
  assignee_id?: number;
  due_date?: string;
  resolution?: string;
  tag_ids?: number[];
}

export interface RemarkCommentInput {
  text: string;
  is_internal: boolean;
}

export interface RemarkActionInput {
  action: 'assign' | 'resolve' | 'reject' | 'defer' | 'reopen' | 'close' | 'change_priority';
  payload: Record<string, unknown>;
  comment?: string;
}

export interface RemarkTagCreateInput {
  name: string;
  color: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
