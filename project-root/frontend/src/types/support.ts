export type TicketStatus = 'new' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentSeverity = 'p1_critical' | 'p2_major' | 'p3_minor' | 'p4_info';
export type IncidentStatus = 'detected' | 'investigating' | 'mitigated' | 'resolved' | 'postmortem';

export interface SupportTicket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester: string;
  assignee: string | null;
  category: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  sla_deadline: string;
  tags: string[];
}

export interface Incident {
  id: number;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affected_systems: string[];
  detected_at: string;
  resolved_at: string | null;
  lead: string;
  timeline: { time: string; event: string }[];
  postmortem?: Postmortem;
}

export interface Postmortem {
  id: number;
  summary: string;
  root_cause: string;
  resolution: string;
  lessons_learned: string[];
  action_items: { text: string; assignee: string; due_date: string; status: string }[];
  created_at: string;
}

export interface KBArticle {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  content: string;
  tags: string[];
  views: number;
  helpful_count: number;
  author: string;
  updated_at: string;
}

export interface SLAConfig {
  id: number;
  priority: TicketPriority;
  response_time_minutes: number;
  resolution_time_hours: number;
  business_hours_only: boolean;
}
