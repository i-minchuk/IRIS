import client from '@/shared/api/client';

export interface LockResult {
  document_id: number;
  locked_by_id: number;
  locked_at: string;
}

export const lockDocument = async (documentId: number): Promise<LockResult> => {
  const { data } = await client.post(`/api/v1/documents/${documentId}/lock`);
  return data;
};

export const unlockDocument = async (documentId: number): Promise<LockResult> => {
  const { data } = await client.post(`/api/v1/documents/${documentId}/unlock`);
  return data;
};
