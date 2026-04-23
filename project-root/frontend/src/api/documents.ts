import client from './client';

export interface DocumentItem {
  id: number;
  number: string;
  name: string;
  code?: string;
  title?: string;
  doc_type: string;
  status: string;
  crs_code?: string;
  author_id: number;
  project_id: number;
  section_id?: number;
  created_at: string;
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
  remarks: Remark[];
}

export interface Revision {
  id: number;
  number: string;
  status: string;
  trigger_type?: string;
  file_path?: string;
  created_at: string;
}

export interface Remark {
  id: number;
  title: string;
  description?: string;
  severity: string;
  status: string;
  remark_type: string;
  category?: string;
  deadline?: string;
  document_id?: number;
  document_number?: string;
  document_name?: string;
  project_id?: number;
  created_at: string;
}

export const getDocuments = async (params?: { project_id?: number; section_id?: number }): Promise<DocumentItem[]> => {
  const { data } = await client.get('/api/v1/documents', { params });
  return data;
};

export const getDocument = async (id: number): Promise<DocumentDetail> => {
  const { data } = await client.get(`/api/v1/documents/${id}`);
  return data;
};

export const createDocument = async (body: Partial<DocumentItem>): Promise<DocumentItem> => {
  const { data } = await client.post('/api/v1/documents', body);
  return data;
};

export const updateDocument = async (id: number, body: Partial<DocumentItem> & { content?: Record<string, unknown> }): Promise<DocumentItem> => {
  const { data } = await client.patch(`/api/v1/documents/${id}`, body);
  return data;
};

export const createRevision = async (documentId: number, body: Partial<Revision>): Promise<Revision> => {
  const { data } = await client.post(`/api/v1/documents/${documentId}/revisions`, body);
  return data;
};

export const createRemark = async (documentId: number, body: Partial<Remark>): Promise<Remark> => {
  const { data } = await client.post(`/api/v1/documents/${documentId}/remarks`, body);
  return data;
};

export const updateRemarkStatus = async (remarkId: number, body: { status: string; response?: string; resolution_action?: string }): Promise<Remark> => {
  const { data } = await client.patch(`/api/v1/documents/remarks/${remarkId}/status`, body);
  return data;
};

export interface RemarkFilter {
  project_id?: number;
  severity?: string;
  status?: string;
  remark_type?: string;
  category?: string;
}

export const getAllRemarks = async (filters?: RemarkFilter): Promise<Remark[]> => {
  const { data } = await client.get('/api/v1/documents/remarks/all', { params: filters });
  return data;
};
