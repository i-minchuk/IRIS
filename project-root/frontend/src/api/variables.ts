import client from './client';

export interface Variable {
  id: number;
  scope: string;
  project_id?: number;
  document_id?: number;
  key: string;
  value?: string;
  default_value?: string;
  is_computed: boolean;
}

export const getVariables = async (params?: { scope?: string; project_id?: number }): Promise<Variable[]> => {
  const { data } = await client.get('/api/v1/variables', { params });
  return data;
};

export const createVariable = async (body: Partial<Variable>): Promise<Variable> => {
  const { data } = await client.post('/api/v1/variables', body);
  return data;
};

export const updateVariable = async (id: number, body: { value: string; reason?: string; triggered_by?: string }): Promise<Variable> => {
  const { data } = await client.patch(`/api/v1/variables/${id}`, body);
  return data;
};

export const substituteVariable = async (id: number, template: string): Promise<{ original: string; substituted: string; variable: string }> => {
  const { data } = await client.post(`/api/v1/variables/${id}/substitute`, { template });
  return data;
};
