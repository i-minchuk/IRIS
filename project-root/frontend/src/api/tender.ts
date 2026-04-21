import client from './client';
import type { TenderResult, TenderDoc } from '../types';

export const assessTender = async (body: {
  tender_name: string;
  customer: string;
  deadline_date: string;
  documents: TenderDoc[];
}): Promise<TenderResult> => {
  const { data } = await client.post('/api/tender/assess', body);
  return data;
};
