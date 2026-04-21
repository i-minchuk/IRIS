import client from './client';
import type { WorkloadResponse } from '../types';

export const getWorkload = async (dateFrom?: string, dateTo?: string): Promise<WorkloadResponse> => {
  const { data } = await client.get('/api/workload/engineers', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return data;
};
