import apiClient from '@/shared/api/client';

export interface GlossaryTerm {
  id: number;
  term: string;
  definition: string;
  company_usage: string | null;
  where_found: string | null;
  department: string | null;
  source: string;
  document_id: number | null;
  project_id: number | null;
  created_by_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface GlossaryGenerateResponse {
  generated: number;
  terms: GlossaryTerm[];
}

export const fetchGlossaryTerms = async (
  projectId?: number,
  department?: string,
  search?: string
): Promise<GlossaryTerm[]> => {
  const params = new URLSearchParams();
  if (projectId) params.append('project_id', String(projectId));
  if (department) params.append('department', department);
  if (search) params.append('search', search);
  const { data } = await apiClient.get<GlossaryTerm[]>(
    `/references/glossary?${params.toString()}`
  );
  return data;
};

export const generateGlossary = async (
  projectId?: number,
  limitDocuments?: number
): Promise<GlossaryGenerateResponse> => {
  const { data } = await apiClient.post<GlossaryGenerateResponse>(
    '/references/glossary/generate',
    {
      project_id: projectId || null,
      limit_documents: limitDocuments ?? 50,
    }
  );
  return data;
};

export const deleteGlossaryTerm = async (termId: number): Promise<void> => {
  await apiClient.delete(`/references/glossary/${termId}`);
};
