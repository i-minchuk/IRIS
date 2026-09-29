import client from '@/shared/api/client';
import { getRemarks } from '@/features/remarks/api/remarks';
import type { RemarkListItem } from '@/types/remarks';

export interface DocumentItem {
  id: number;
  number: string;
  name: string;
  code?: string;
  title?: string;
  doc_type: string;
  status: string;
  crs_code?: string;
  author_id?: number;
  project_id: number;
  section_id?: number;
  current_revision_id?: number | null;
  ai_classified_type?: string;
  ai_confidence?: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
  delete_reason?: string | null;
  created_at?: string;
  has_file?: boolean;
  assignee_ids?: number[] | null;
  standard_ids?: number[] | null;
}

export interface LockedByUser {
  id: number;
  full_name: string;
}

export interface DocumentDetail extends DocumentItem {
  crs_approved_date?: string;
  content: Record<string, unknown>;
  variables_snapshot: Record<string, unknown>;
  current_revision_id?: number;
  code?: string;
  title?: string;
  discipline?: string;
  locked_by_user?: LockedByUser | null;
  revisions: Revision[];
}

export interface DocumentDetailWithRemarks extends DocumentDetail {
  remarks: RemarkListItem[];
}

export interface Revision {
  id: number;
  number: string;
  status: string;
  trigger_type?: string;
  file_path?: string;
  created_at: string;
  changes_summary?: string;
}

export const getDocuments = async (params?: { project_id?: number; section_id?: number; page?: number; page_size?: number }): Promise<DocumentItem[]> => {
  const { data } = await client.get('/documents', { params });
  return data;
};

export interface DocumentListParams {
  project_id?: number;
  section_id?: number;
  status?: string;
  include_deleted?: boolean;
  page?: number;
  page_size?: number;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export const getDocumentsList = async (params?: DocumentListParams): Promise<DocumentListResponse> => {
  const { data } = await client.get('/documents', { params });
  return data;
};

export const excludeDocument = async (id: number, reason?: string): Promise<DocumentItem> => {
  const { data } = await client.delete(`/documents/${id}`, {
    params: reason ? { reason } : {},
  });
  return data;
};

export const restoreDocument = async (id: number): Promise<DocumentItem> => {
  const { data } = await client.post(`/documents/${id}/restore`);
  return data;
};

export const getDocument = async (id: number): Promise<DocumentDetail> => {
  const { data } = await client.get(`/documents/${id}`);
  return data;
};

export const getDocumentWithRemarks = async (id: number): Promise<DocumentDetailWithRemarks> => {
  const [doc, remarksResponse] = await Promise.all([
    getDocument(id),
    getRemarks({
      document_id: id,
      page: 1,
      page_size: 100,
    }),
  ]);
  return {
    ...doc,
    remarks: remarksResponse.items,
  };
};

export const createDocument = async (body: Partial<DocumentItem>): Promise<DocumentItem> => {
  const { data } = await client.post('/documents', body);
  return data;
};

export const updateDocument = async (id: number, body: Partial<DocumentItem> & { content?: Record<string, unknown> }): Promise<DocumentItem> => {
  const { data } = await client.patch(`/documents/${id}`, body);
  return data;
};

export const createRevision = async (documentId: number, body: Partial<Revision>): Promise<Revision> => {
  const { data } = await client.post(`/documents/${documentId}/revisions`, body);
  return data;
};

export const submitForApproval = async (documentId: number): Promise<{ document_id: number; status: string; workflow_id: number }> => {
  const { data } = await client.post(`/documents/${documentId}/submit-for-approval`);
  return data;
};

export const submitForReview = async (documentId: number): Promise<{ document_id: number; status: string }> => {
  const { data } = await client.post(`/documents/${documentId}/submit-for-review`);
  return data;
};

export interface ApprovalRecord {
  user_id: number;
  user_name: string;
  approved_at: string;
}

export interface ApproveResult {
  document_id: number;
  status: string;
  approved: boolean;
  approvals: ApprovalRecord[];
  next_approver: { user_id: number; user_name: string } | null;
  pending_approvers: { user_id: number; user_name: string }[];
}

/** Согласовать документ: переход к следующему согласующему или утверждение. */
export const approveDocument = async (documentId: number): Promise<ApproveResult> => {
  const { data } = await client.post(`/documents/${documentId}/approve`);
  return data;
};

export interface ApprovalFeedItem {
  document_id: number;
  document_code: string;
  document_name: string;
  user_id: number;
  user_name: string;
  approved_at: string;
  document_status: string;
}

/** Лента согласований по всем документам (вкладка «Документооборот»). */
export const getApprovalFeed = async (): Promise<ApprovalFeedItem[]> => {
  const { data } = await client.get('/documents/approval-feed');
  return data;
};

export interface BulkImportDocumentItem {
  name: string;
  number?: string;
  doc_type?: string;
  status?: string;
  crs_code?: string;
  project_id?: number;
  section_id?: number;
}

export interface BulkImportDocumentResult {
  created: number;
  items: { id: number; number: string; name: string; status: string }[];
}

export const bulkImportDocuments = async (items: BulkImportDocumentItem[]): Promise<BulkImportDocumentResult> => {
  const { data } = await client.post<BulkImportDocumentResult>('/documents/import', items);
  return data;
};

export const classifyDocument = async (id: number): Promise<{ type: string; confidence: number }> => {
  const { data } = await client.post(`/documents/${id}/classify`);
  return data;
};

export const uploadDocumentFile = async (documentId: number, file: File): Promise<unknown> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post(`/documents/${documentId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

/** Скачать файл ревизии (возвращает имя файла и blob) */
export const downloadRevisionFile = async (
  documentId: number,
  revisionId: number,
): Promise<{ filename: string; blob: Blob }> => {
  const res = await client.get(`/documents/${documentId}/revisions/${revisionId}/download`, {
    responseType: 'blob',
  });
  const disposition: string = res.headers['content-disposition'] || '';
  let filename = `file-${revisionId}`;
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (match) {
    try {
      filename = decodeURIComponent(match[1]);
    } catch {
      filename = match[1];
    }
  }
  return { filename, blob: res.data as Blob };
};

export type ActionTaskStatus = 'new' | 'in_progress' | 'done';

/** Статусы производных задач документооборота текущего пользователя */
export const getActionTaskStatuses = async (): Promise<Record<string, ActionTaskStatus>> => {
  const { data } = await client.get('/documents/action-tasks/statuses');
  return data.statuses ?? {};
};

/** Сохранить статус производной задачи (new/in_progress/done) */
export const setActionTaskStatus = async (
  taskKey: string,
  status: ActionTaskStatus,
): Promise<void> => {
  await client.put(`/documents/action-tasks/${encodeURIComponent(taskKey)}/status`, { status });
};

export interface StandardRequirement {
  type: string;
  value: string;
  description?: string;
  section?: string;
  standard_name?: string;
  standard_code?: string;
}

export const getDocumentStandards = async (id: number): Promise<StandardRequirement[]> => {
  const { data } = await client.get<StandardRequirement[]>(`/references/standards/by-document/${id}`);
  return data;
};
