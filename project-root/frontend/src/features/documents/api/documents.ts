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
  created_at?: string;
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

export const getDocuments = async (params?: { project_id?: number; section_id?: number }): Promise<DocumentItem[]> => {
  const { data } = await client.get('/documents', { params });
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
