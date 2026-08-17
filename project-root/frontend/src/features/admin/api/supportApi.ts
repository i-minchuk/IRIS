import apiClient from '@/shared/api/client';
import type { SupportTicket, Incident, KBArticle } from '@/types/support';

/** Ответ backend /support/tickets (SupportTicketResponse).
 * sla_deadline может прийти null — нормализуем в ''. */
interface TicketApiItem extends Omit<SupportTicket, 'sla_deadline'> {
  sla_deadline: string | null;
}

/** Ответ backend /support/incidents (IncidentResponse).
 * postmortem приходит null, когда его нет — нормализуем в undefined. */
interface IncidentApiItem extends Omit<Incident, 'postmortem'> {
  postmortem: Incident['postmortem'] | null;
}

export type TicketCreatePayload = Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'resolved_at'>;
export type TicketUpdatePayload = Partial<Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>>;
export type IncidentCreatePayload = Omit<Incident, 'id' | 'detected_at' | 'resolved_at'>;
export type IncidentUpdatePayload = Partial<Omit<Incident, 'id' | 'detected_at'>>;
export type KBArticleCreatePayload = Omit<KBArticle, 'id' | 'views' | 'helpful_count' | 'updated_at'>;
export type KBArticleUpdatePayload = Partial<Omit<KBArticle, 'id' | 'views' | 'updated_at'>>;

function mapToTicket(item: TicketApiItem): SupportTicket {
  return { ...item, sla_deadline: item.sla_deadline ?? '' };
}

function mapToIncident(item: IncidentApiItem): Incident {
  return { ...item, postmortem: item.postmortem ?? undefined };
}

// ---------- Tickets ----------

export async function getTickets(): Promise<SupportTicket[]> {
  const { data } = await apiClient.get<TicketApiItem[]>('/support/tickets');
  return data.map(mapToTicket);
}

export async function getTicket(id: number): Promise<SupportTicket> {
  const { data } = await apiClient.get<TicketApiItem>(`/support/tickets/${id}`);
  return mapToTicket(data);
}

export async function createTicket(payload: TicketCreatePayload): Promise<SupportTicket> {
  const { data } = await apiClient.post<TicketApiItem>('/support/tickets', payload);
  return mapToTicket(data);
}

export async function updateTicket(id: number, payload: TicketUpdatePayload): Promise<SupportTicket> {
  const { data } = await apiClient.patch<TicketApiItem>(`/support/tickets/${id}`, payload);
  return mapToTicket(data);
}

export async function deleteTicket(id: number): Promise<void> {
  await apiClient.delete(`/support/tickets/${id}`);
}

// ---------- Incidents ----------

export async function getIncidents(): Promise<Incident[]> {
  const { data } = await apiClient.get<IncidentApiItem[]>('/support/incidents');
  return data.map(mapToIncident);
}

export async function getIncident(id: number): Promise<Incident> {
  const { data } = await apiClient.get<IncidentApiItem>(`/support/incidents/${id}`);
  return mapToIncident(data);
}

export async function createIncident(payload: IncidentCreatePayload): Promise<Incident> {
  const { data } = await apiClient.post<IncidentApiItem>('/support/incidents', payload);
  return mapToIncident(data);
}

export async function updateIncident(id: number, payload: IncidentUpdatePayload): Promise<Incident> {
  const { data } = await apiClient.patch<IncidentApiItem>(`/support/incidents/${id}`, payload);
  return mapToIncident(data);
}

export async function deleteIncident(id: number): Promise<void> {
  await apiClient.delete(`/support/incidents/${id}`);
}

// ---------- KB Articles ----------

export async function getKbArticles(): Promise<KBArticle[]> {
  const { data } = await apiClient.get<KBArticle[]>('/support/kb/articles');
  return data;
}

export async function getKbArticle(id: number): Promise<KBArticle> {
  const { data } = await apiClient.get<KBArticle>(`/support/kb/articles/${id}`);
  return data;
}

export async function createKbArticle(payload: KBArticleCreatePayload): Promise<KBArticle> {
  const { data } = await apiClient.post<KBArticle>('/support/kb/articles', payload);
  return data;
}

export async function updateKbArticle(id: number, payload: KBArticleUpdatePayload): Promise<KBArticle> {
  const { data } = await apiClient.patch<KBArticle>(`/support/kb/articles/${id}`, payload);
  return data;
}

export async function deleteKbArticle(id: number): Promise<void> {
  await apiClient.delete(`/support/kb/articles/${id}`);
}
