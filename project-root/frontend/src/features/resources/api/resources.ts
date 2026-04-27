import client from '@/shared/api/client';

export interface WeeklyLoad {
  week: string;
  hours: number;
  capacity: number;
  utilization: number;
  status: 'free' | 'busy' | 'overload';
}

export interface TeamMemberWorkload {
  id: number;
  full_name: string;
  role: string;
  active_projects: number;
  documents_total: number;
  month_active_hours: number;
  efficiency: number;
  sessions_count: number;
  weekly_load: WeeklyLoad[];
}

export interface ProjectSummary {
  id: number;
  name: string;
  code: string;
  team_size: number;
}

export interface WorkloadData {
  weeks: string[];
  team: TeamMemberWorkload[];
  active_projects: ProjectSummary[];
  total_team_size: number;
}

export interface HeatmapEmployee {
  id: number;
  name: string;
  load: number;
  projects: string[];
}

export interface HeatmapDepartment {
  dept: string;
  employees: HeatmapEmployee[];
}

export interface HeatmapData {
  departments: HeatmapDepartment[];
  updated_at: string;
}

export const resourcesApi = {
  getWorkload: () => client.get<WorkloadData>('/resources/workload'),
  getHeatmap: () => client.get<HeatmapData>('/resources/heatmap'),
};
