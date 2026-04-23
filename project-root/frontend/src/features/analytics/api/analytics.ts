import client from '@/shared/api/client';

export interface KpiData {
  active_projects: number;
  total_documents: number;
  approved_documents: number;
  open_remarks: number;
  critical_remarks: number;
  avg_efficiency: number;
}

export interface ScorecardProject {
  id: number;
  name: string;
  code: string;
  status: string;
  progress: number;
  health: 'green' | 'yellow' | 'red';
  documents_total: number;
  documents_approved: number;
  open_remarks: number;
  deadline?: string;
}

export interface TeamMember {
  id: number;
  full_name: string;
  role: string;
  documents_count: number;
  open_remarks: number;
  sessions: number;
  efficiency: number;
  active_time_hours: number;
}

export interface DashboardData {
  kpis: KpiData;
  scorecard: ScorecardProject[];
  team: TeamMember[];
}

export const analyticsApi = {
  getDashboard: () => client.get<DashboardData>('/analytics/dashboard'),
};
