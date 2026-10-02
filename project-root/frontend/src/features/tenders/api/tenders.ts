import client from '@/shared/api/client';
import type { Tender, TenderStage, TenderSummary, TenderTask } from '../types/tender';

export const getTenders = async (filters?: { status?: string; stage?: string }): Promise<Tender[]> => {
  const { data } = await client.get('/tenders', { params: filters });
  // Backend возвращает пагинированный ответ {items, total, page, ...}
  if (Array.isArray(data)) return data;
  return data.items ?? [];
};

export const getTender = async (id: number): Promise<Tender> => {
  const { data } = await client.get(`/tenders/${id}`);
  return data;
};

export const createTender = async (body: Partial<Tender>): Promise<Tender> => {
  const { data } = await client.post('/tenders', body);
  return data;
};

export const updateTender = async (id: number, body: Partial<Tender>): Promise<Tender> => {
  const { data } = await client.patch(`/tenders/${id}`, body);
  return data;
};

/** Загрузка файла стандарта до создания тендера. */
export const uploadStandardAttachment = async (
  file: File,
): Promise<{ file_name: string; stored_name: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/tenders/standard-attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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

/** Номер КП, который будет присвоен следующему тендеру (для превью в форме). */
export const getNextKpNumber = async (): Promise<string> => {
  const { data } = await client.get('/tenders/next-kp-number');
  return data.kp_number;
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

/** Поля одной строки импорта тендеров (клиент маппит колонки Excel). */
export interface TenderImportRow {
  name: string;
  customer_name?: string;
  project_type?: string;
  volume?: number | null;
  volume_unit?: string;
  nmc?: number | null;
  our_price?: number | null;
  stage?: string;
  deadline?: string | null;
  region?: string;
  platform?: string;
  responsible_name?: string;
}

export const importTenders = async (
  items: TenderImportRow[],
): Promise<{ created: number; skipped: number; items: { id: number; kp_number: string; name: string }[] }> => {
  const { data } = await client.post('/tenders/import', items);
  return data;
};

/** Скачать все тендеры Excel-файлом (через axios, чтобы подставился токен). */
export const exportTenders = async (): Promise<void> => {
  const response = await client.get('/tenders/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const disposition: string = response.headers?.['content-disposition'] ?? '';
  const match = disposition.match(/filename=([^;]+)/);
  link.download = match ? match[1].trim() : 'tenders_export.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
