/** API client for Remarks */
import apiClient from '@/shared/api/client';
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

// ==================== Remark Endpoints ====================

export async function createRemark(data: RemarkCreateInput): Promise<Remark> {
  const { data: responseData } = await apiClient.post<Remark>('/remarks', data);
  return responseData;
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

  const { data } = await apiClient.get<PaginatedResponse<RemarkListItem>>(`/remarks?${params}`);
  return data;
}

export async function getRemark(id: string): Promise<Remark> {
  const { data } = await apiClient.get<Remark>(`/remarks/${id}`);
  return data;
}

export async function updateRemark(id: string, data: RemarkUpdateInput): Promise<Remark> {
  const { data: responseData } = await apiClient.put<Remark>(`/remarks/${id}`, data);
  return responseData;
}

export async function deleteRemark(id: string): Promise<void> {
  await apiClient.delete<void>(`/remarks/${id}`);
}

// ==================== Comment Endpoints ====================

export async function addComment(remarkId: string, data: RemarkCommentInput): Promise<RemarkComment> {
  const { data: responseData } = await apiClient.post<RemarkComment>(`/remarks/${remarkId}/comments`, data);
  return responseData;
}

export async function deleteComment(remarkId: string, commentId: number): Promise<void> {
  await apiClient.delete<void>(`/remarks/${remarkId}/comments/${commentId}`);
}

// ==================== Action Endpoints ====================

export async function performAction(remarkId: string, action: RemarkActionInput): Promise<{ success: boolean; action: string; remark_id: string; new_status: string; workflow_instance_id?: number }> {
  const { data } = await apiClient.post<{ success: boolean; action: string; remark_id: string; new_status: string; workflow_instance_id?: number }>(`/remarks/${remarkId}/actions`, action);
  return data;
}

export async function startRemarkWorkflow(remarkId: string): Promise<{ success: boolean; remark_id: string; workflow_instance_id: number | null }> {
  const { data } = await apiClient.post<{ success: boolean; remark_id: string; workflow_instance_id: number | null }>(`/remarks/${remarkId}/start-workflow`);
  return data;
}

export async function linkRemarks(remarkId: string, relatedId: string): Promise<{ success: boolean; linked: string[] }> {
  const { data } = await apiClient.post<{ success: boolean; linked: string[] }>(`/remarks/${remarkId}/link/${relatedId}`);
  return data;
}

// ==================== Statistics Endpoint ====================

export async function getStatistics(projectId?: number, documentId?: number): Promise<RemarkStatistics> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId.toString());
  if (documentId) params.append('document_id', documentId.toString());

  const { data } = await apiClient.get<RemarkStatistics>(`/remarks/statistics?${params}`);
  return data;
}

// ==================== Export Endpoint ====================

export async function exportRemarks(projectId?: number, documentId?: number): Promise<Blob> {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', projectId.toString());
  if (documentId) params.append('document_id', documentId.toString());

  const { data } = await apiClient.get<Blob>(`/remarks/export?${params}`, {
    responseType: 'blob',
  });

  return data;
}

// ==================== Tag Endpoints ====================

export async function getTags(): Promise<RemarkTag[]> {
  const { data } = await apiClient.get<RemarkTag[]>('/remarks/tags');
  return data;
}

export async function createTag(data: RemarkTagCreateInput): Promise<RemarkTag> {
  const { data: responseData } = await apiClient.post<RemarkTag>('/remarks/tags', data);
  return responseData;
}

export async function deleteTag(tagId: number): Promise<void> {
  await apiClient.delete<void>(`/remarks/tags/${tagId}`);
}
