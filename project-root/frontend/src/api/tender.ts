import client from './client';

export interface Tender {
  id: number;
  name: string;
  customer_name: string;
  project_type: string;
  volume?: number;
  volume_unit?: string;
  complexity: string;
  standards: string[];
  start_date?: string;
  deadline?: string;
  duration_months?: number;
  calculated_hours?: number;
  calculated_cost?: number;
  team_size?: number;
  team_composition: Record<string, unknown>;
  status: string;
  created_at: string;
}

export const getTenders = async (status?: string): Promise<Tender[]> => {
  const { data } = await client.get('/api/v1/tenders', { params: { status } });
  return data;
};

export const getTender = async (id: number): Promise<Tender> => {
  const { data } = await client.get(`/api/v1/tenders/${id}`);
  return data;
};

export const createTender = async (body: Partial<Tender>): Promise<Tender> => {
  const { data } = await client.post('/api/v1/tenders', body);
  return data;
};

export const calculateTender = async (tenderId: number): Promise<{
  tender_id: number;
  name: string;
  total_hours: number;
  duration_months: number;
  team_size: number;
  team_composition: Record<string, number>;
  monthly_load: { month: number; hours: number; utilization: number; status: string }[];
  document_estimate: Record<string, number>;
  overload_risk: boolean;
  recommendations: string[];
}> => {
  const { data } = await client.post(`/api/v1/tenders/${tenderId}/calculate`);
  return data;
};

export const generatePreview = async (tenderId: number, body: { doc_type: string; name: string; content_data?: Record<string, unknown> }): Promise<{ id: number; doc_type: string; name: string }> => {
  const { data } = await client.post(`/api/v1/tenders/${tenderId}/generate-preview`, body);
  return data;
};
