import client from '@/api/client';
import type { Tender, TenderStage, TenderSummary, TenderTask } from '../types/tender';

export const getTenders = async (filters?: { status?: string; stage?: string }): Promise<Tender[]> => {
  const { data } = await client.get('/api/v1/tenders', { params: filters });
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

export const updateTenderStage = async (
  id: number,
  updates: { stage?: TenderStage; status?: string; our_price?: number; margin_pct?: number; probability?: number }
): Promise<Tender> => {
  const { data } = await client.patch(`/api/v1/tenders/${id}/stage`, updates);
  return data;
};

export const getTenderSummary = async (): Promise<TenderSummary> => {
  const { data } = await client.get('/api/v1/tenders/portfolio-summary');
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

// Tasks (mock endpoint until backend implemented)
export const getTenderTasks = async (): Promise<TenderTask[]> => {
  // TODO: replace with real endpoint
  return Promise.resolve([]);
};
