import client from '@/shared/api/client';
import type { Tender, TenderStage, TenderSummary, TenderTask } from '../types/tender';

export const getTenders = async (filters?: { status?: string; stage?: string }): Promise<Tender[]> => {
  const { data } = await client.get('/tenders', { params: filters });
  return data;
};

export const getTender = async (id: number): Promise<Tender> => {
  const { data } = await client.get(`/tenders/${id}`);
  return data;
};

export const createTender = async (body: Partial<Tender>): Promise<Tender> => {
  const { data } = await client.post('/tenders', body);
  return data;
};

export const updateTenderStage = async (
  id: number,
  updates: { stage?: TenderStage; status?: string; our_price?: number; margin_pct?: number; probability?: number }
): Promise<Tender> => {
  const { data } = await client.patch(`/tenders/${id}/stage`, updates);
  return data;
};

export const getTenderSummary = async (): Promise<TenderSummary> => {
  const { data } = await client.get('/tenders/portfolio-summary');
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
  const { data } = await client.post(`/tenders/${tenderId}/calculate`);
  return data;
};

export const createProjectFromTender = async (tenderId: number): Promise<{
  id: number;
  name: string;
  code: string;
  customer_name?: string;
  status: string;
  stage?: string;
  planned_finish?: string;
  created_at?: string;
}> => {
  const { data } = await client.post(`/tenders/${tenderId}/create-project`);
  return data;
};

export const getTenderTasks = async (tenderId: number): Promise<TenderTask[]> => {
  const { data } = await client.get(`/tenders/${tenderId}/tasks`);
  return data;
};
