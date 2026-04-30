/** API client for Remarks */
import {
  Remark,
  RemarkListItem,
  RemarkFilter,
  RemarkStatistics,
  RemarkComment,
  RemarkTag,
  RemarkCreateInput,
  RemarkUpdateInput,
  RemarkCommentInput,
  RemarkActionInput,
  RemarkTagCreateInput,
  PaginatedResponse
} from '@/types/remarks';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ==================== Remark Endpoints ====================

export async function createRemark(data: RemarkCreateInput): Promise<Remark> {
  return request<Remark>('/remarks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getRemarks(filter: RemarkFilter): Promise<PaginatedResponse<RemarkListItem>> {
  const params = new URLSearchParams();
  
  if (filter.project_id) params.append('project_id', filter.project_id.toString());
  if (filter.document_id) params.append('document_id', filter.document_id.toString());
  if (filter.status) filter.status.forEach(s => params.append('status', s));
  if (filter.priority) filter.priority.forEach(p => params.append('priority', p));
  if (filter.category) filter.category.forEach(c => params.append('category', c));
  if (filter.source) filter.source.forEach(s => params.append('source', s));
  if (filter.assignee_id) params.append('assignee_id', filter.assignee_id.toString());
  if (filter.author_id) params.append('author_id', filter.author_id.toString());
  if (filter.date_from) params.append('date_from', filter.date_from);
  if (filter.date_to) params.append('date_to', filter.date_to);
  if (filter.search_text) params.append('search_text', filter.search_text);
  if (filter.tag_ids) filter.tag_ids.forEach(t => params.append('tag_ids', t.toString()));
  if (filter.sort_by) params.append('sort_by', filter.sort_by);
  if (filter.sort_order) params.append('sort_order', filter.sort_order);
  params.append('page', filter.page.toString());
  params.append('page_size', filter.page_size.toString());

  return request<PaginatedResponse<RemarkListItem>>(`/remarks?${params}`);
}

export async function getRemark(id: string): Promise<Remark> {
  return request<Remark>(`/remarks/${id}`);
}

export async function updateRemark(id: string, data: RemarkUpdateInput): Promise<Remark> {
  return request<Remark>(`/remarks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRemark(id: string): Promise<void> {
  await request<void>(`/remarks/${id}`, {
    method: 'DELETE',
  });
}

// ==================== Comment Endpoints ====================

export async function addComment(remarkId: string, data: RemarkCommentInput): Promise<RemarkComment> {
  return request<RemarkComment>(`/remarks/${remarkId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteComment(remarkId: string, commentId: number): Promise<void> {
  await request<void>(`/remarks/${remarkId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ==================== Action Endpoints ====================

export async function performAction(remarkId: string, action: RemarkActionInput): Promise<{ success: boolean; action: string; remark_id: string; new_status: string }> {
  return request(`/remarks/${remarkId}/actions`, {
    method: 'POST',
    body: JSON.stringify(action),
  });
}

export async function linkRemarks(remarkId: string, relatedId: string): Promise<{ success: boolean; linked: string[] }> {
  return request(`/remarks/${remarkId}/link/${relatedId}`, {
    method: 'POST',
  });
}

// ==================== Statistics Endpoint ====================

export async function getStatistics(projectId?: number, documentId?: number): Promise<RemarkStatistics> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId.toString());
  if (documentId) params.append('document_id', documentId.toString());
  
  return request<RemarkStatistics>(`/remarks/statistics?${params}`);
}

// ==================== Export Endpoint ====================

export async function exportRemarks(projectId?: number, documentId?: number): Promise<Blob> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId.toString());
  if (documentId) params.append('document_id', documentId.toString());

  const response = await fetch(`${API_BASE}/remarks/export?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  return response.blob();
}

// ==================== Tag Endpoints ====================

export async function getTags(): Promise<RemarkTag[]> {
  return request<RemarkTag[]>('/remarks/tags');
}

export async function createTag(data: RemarkTagCreateInput): Promise<RemarkTag> {
  return request<RemarkTag>('/remarks/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteTag(tagId: number): Promise<void> {
  await request<void>(`/remarks/tags/${tagId}`, {
    method: 'DELETE',
  });
}
