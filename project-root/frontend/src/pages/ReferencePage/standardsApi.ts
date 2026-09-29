import apiClient from '@/shared/api/client';

export interface StandardRequirement {
  type: string;
  value: string;
  description?: string;
  section?: string;
}

export interface Standard {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  file_name: string | null;
  file_size: number | null;
  requirements: StandardRequirement[];
  source: string;
  created_by_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface StandardCreatePayload {
  name: string;
  code?: string;
  description?: string;
  requirements?: StandardRequirement[];
  source?: string;
}

export const fetchStandards = async (search?: string): Promise<Standard[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const { data } = await apiClient.get<Standard[]>(
    `/references/standards?${params.toString()}`
  );
  return data;
};

export const createStandard = async (
  payload: StandardCreatePayload
): Promise<Standard> => {
  const { data } = await apiClient.post<Standard>('/references/standards', payload);
  return data;
};

export const uploadStandard = async (
  file: File,
  name?: string,
  code?: string,
  description?: string
): Promise<Standard> => {
  const formData = new FormData();
  formData.append('file', file);
  if (name) formData.append('name', name);
  if (code) formData.append('code', code);
  if (description) formData.append('description', description);
  const { data } = await apiClient.post<Standard>(
    '/references/standards/upload',
    formData,
    {
      headers: { 'Content-Type': undefined },
    }
  );
  return data;
};

export const deleteStandard = async (id: number): Promise<void> => {
  await apiClient.delete(`/references/standards/${id}`);
};
