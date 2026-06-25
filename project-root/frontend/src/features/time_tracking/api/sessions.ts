import client from '@/shared/api/client';

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

export interface PaginatedSessions {
  items: TimeSession[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface StartSessionBody {
  document_id?: number;
  project_id?: number;
}

export interface StopSessionBody {
  active_time: number;
  edit_count?: number;
  blocks_modified?: string[];
  variables_changed?: string[];
  revisions_created?: number;
  remarks_resolved?: number;
  efficiency_score?: number;
}

export interface EmployeeAnalytics {
  user_id: number;
  total_sessions: number;
  total_active_time: number;
  avg_efficiency: number;
}

export async function getSessions(params?: {
  user_id?: number;
  project_id?: number;
  page?: number;
  page_size?: number;
}): Promise<PaginatedSessions> {
  const { data } = await client.get('/time-tracking/sessions', { params });
  return data;
}

export async function startSession(body: StartSessionBody): Promise<TimeSession> {
  const { data } = await client.post('/time-tracking/sessions/start', body);
  return data;
}

export async function stopSession(
  sessionId: number,
  body: StopSessionBody
): Promise<TimeSession> {
  const { data } = await client.post(
    `/time-tracking/sessions/${sessionId}/stop`,
    body
  );
  return data;
}

export async function getEmployeeAnalytics(userId: number): Promise<EmployeeAnalytics> {
  const { data } = await client.get(`/time-tracking/analytics/employee/${userId}`);
  return data;
}
