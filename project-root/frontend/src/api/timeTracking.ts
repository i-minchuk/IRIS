import client from './client';

export interface TimeSession {
  id: number;
  user_id: number;
  document_id?: number;
  project_id?: number;
  started_at: string;
  ended_at?: string;
  total_duration: number;
  active_time: number;
  efficiency_score?: number;
}

export interface EmployeeAnalytics {
  user_id: number;
  total_sessions: number;
  total_active_time: number;
  avg_efficiency: number;
}

export const getSessions = async (params?: { user_id?: number; project_id?: number }): Promise<TimeSession[]> => {
  const { data } = await client.get('/api/v1/time-tracking/sessions', { params });
  return data;
};

export const startSession = async (body: { document_id?: number; project_id?: number }): Promise<{ id: number; started_at: string }> => {
  const { data } = await client.post('/api/v1/time-tracking/sessions/start', body);
  return data;
};

export const stopSession = async (sessionId: number, body: {
  active_time: number;
  edit_count?: number;
  blocks_modified?: string[];
  variables_changed?: string[];
  revisions_created?: number;
  remarks_resolved?: number;
  efficiency_score?: number;
}): Promise<{ id: number; total_duration: number; active_time: number; efficiency_score?: number }> => {
  const { data } = await client.post(`/api/v1/time-tracking/sessions/${sessionId}/stop`, body);
  return data;
};

export const getEmployeeAnalytics = async (userId: number): Promise<EmployeeAnalytics> => {
  const { data } = await client.get(`/api/v1/time-tracking/analytics/employee/${userId}`);
  return data;
};
