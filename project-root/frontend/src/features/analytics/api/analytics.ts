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

export interface KpiTile {
  id: string;
  label: string;
  value: string;
  trend: string | null;
  trend_direction: 'up' | 'down' | null;
  status: 'green' | 'yellow' | 'red';
  subtext: string;
  clickable?: boolean;
}

export interface KpiTilesResponse {
  tiles: KpiTile[];
}

export interface PortfolioProject {
  id: number;
  name: string;
  code: string;
  budget_pct: number;
  schedule_pct: number;
  total_budget_m: number;
  zone: 'stars' | 'budget' | 'recoverable' | 'crisis';
  zone_label: string;
  status: string;
}

export interface PortfolioData {
  projects: PortfolioProject[];
  zones: Record<string, number>;
  updated_at: string;
}

export interface AlertItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  icon: string;
  title: string;
  message: string;
  action_label: string;
  action_path: string;
}

export interface AlertsData {
  alerts: AlertItem[];
  total: number;
  updated_at: string;
}

export interface TenderPipelineStage {
  key: string;
  label: string;
  count: number;
  sum_cost_m: number;
}

export interface TenderPipelineData {
  stages: TenderPipelineStage[];
  max_count: number;
  win_rate: number;
  avg_prep_days: number;
  overdue_count: number;
  updated_at: string;
}

export interface DocumentProjectSummary {
  project_id: number;
  project_name: string;
  project_code: string;
  draft: number;
  in_review: number;
  approved: number;
  overdue: number;
}

export interface DocumentsByProjectData {
  projects: DocumentProjectSummary[];
  updated_at: string;
}

export interface SqcdpPillar {
  id: string;
  label: string;
  value: string;
  target: string;
  status: 'green' | 'yellow' | 'red';
  details: Record<string, unknown>;
}

export interface SqcdpData {
  pillars: SqcdpPillar[];
  updated_at: string;
}

export interface ShipmentItem {
  name: string;
  tons: number;
  status: string;
}

export interface ShipmentDay {
  day_label: string;
  date: string;
  is_weekend: boolean;
  items: ShipmentItem[];
}

export interface ShipmentPipelineStage {
  key: string;
  label: string;
  tons: number;
  color: string;
}

export interface ShipmentCalendarData {
  week: string;
  days: ShipmentDay[];
  pipeline: ShipmentPipelineStage[];
  updated_at: string;
}

export interface SparklineChart {
  id: string;
  label: string;
  unit: string;
  current: number;
  trend: number[];
  status: 'green' | 'yellow' | 'red';
}

export interface SparklinesData {
  charts: SparklineChart[];
  updated_at: string;
}

export const analyticsApi = {
  getDashboard: () => client.get<DashboardData>('/analytics/dashboard'),
  getKpiTiles: () => client.get<KpiTilesResponse>('/analytics/kpi'),
  getPortfolio: () => client.get<PortfolioData>('/analytics/portfolio'),
  getAlerts: () => client.get<AlertsData>('/analytics/alerts'),
  getTenderPipeline: () => client.get<TenderPipelineData>('/analytics/tender-pipeline'),
  getDocumentsByProject: () => client.get<DocumentsByProjectData>('/analytics/documents-by-project'),
  getProductionSqcdp: () => client.get<SqcdpData>('/analytics/production-sqcdp'),
  getShipmentsCalendar: () => client.get<ShipmentCalendarData>('/analytics/shipments/calendar'),
  getSparklines: () => client.get<SparklinesData>('/analytics/sparklines'),
};
