import client from './client';
import type { Document, DocumentDetail, Revision } from '../types';
import type { Remark } from '../components/RemarksPanel';

export const getDocuments = async (params?: { project_id?: number; status?: string; search?: string }): Promise<Document[]> => {
  const { data } = await client.get('/api/documents/', { params });
  return data;
};

export const getDocument = async (id: number): Promise<DocumentDetail> => {
  const { data } = await client.get(`/api/documents/${id}`);
  return data;
};

export const createDocument = async (data: {
  project_id: number;
  code: string;
  title: string;
  doc_type: string;
  discipline: string;
}): Promise<Document> => {
  const { data: document } = await client.post('/api/documents/', data);
  return document;
};

export const createRevision = async (
  documentId: number,
  data: {
    revision_index: string;
    revision_letter: string;
    revision_number: number;
    version_number: number;
    change_log: string;
    file?: File;
  }
): Promise<Revision> => {
  // For now, just send the metadata without file
  const { data: revision } = await client.post(`/api/documents/${documentId}/revisions`, {
    revision_index: data.revision_index,
    revision_letter: data.revision_letter,
    revision_number: data.revision_number,
    version_number: data.version_number,
    change_log: data.change_log,
  });
  return revision;
};

export const approveRevision = async (
  documentId: number,
  revisionId: number
): Promise<Revision> => {
  const { data: revision } = await client.post(
    `/api/documents/${documentId}/revisions/${revisionId}/approve`
  );
  return revision;
};

export const getRevisions = async (documentId: number): Promise<Revision[]> => {
  const { data } = await client.get(`/api/documents/${documentId}/revisions`);
  return data;
};

// API для замечаний по документу
export const getRemarksByDocument = async (documentId: number): Promise<Remark[]> => {
  const { data } = await client.get(`/api/remarks/document/${documentId}`);
  return data;
};

// API для замечаний по проекту (для backward compatibility)
export const getRemarksByProject = async (projectId: number): Promise<Remark[]> => {
  const { data } = await client.get(`/api/remarks/project/${projectId}`);
  return data;
};
