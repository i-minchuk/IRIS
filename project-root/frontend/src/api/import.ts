import client from './client';
import type { ExcelPreview, TargetField } from '../types';

export const previewExcel = async (file: File): Promise<ExcelPreview> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/api/import/excel/preview', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getTargetFields = async (): Promise<TargetField[]> => {
  const { data } = await client.get('/api/import/target-fields');
  return data;
};

export const executeImport = async (file: File, config: object) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('config', JSON.stringify(config));
  const { data } = await client.post('/api/import/excel/execute', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
