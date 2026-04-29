export interface Tender {
  id: number;
  name: string;
  customer_name: string;
  project_type: string;
  volume?: number;
  volume_unit?: string;
  complexity: string;
  standards: string[];
  start_date?: string;
  deadline?: string;
  duration_months?: number;

  // Portfolio fields
  stage: TenderStage;
  nmc?: number;
  our_price?: number;
  margin_pct?: number;
  probability?: number;
  platform?: string;
  region?: string;
  responsible_id?: number;
  auction_end_time?: string;
  loss_reason?: string;

  calculated_hours?: number;
  calculated_cost?: number;
  team_size?: number;
  team_composition: Record<string, unknown>;
  status: string;
  created_at: string;
}

export type TenderStage =
  | 'new'
  | 'qualification'
  | 'preparation'
  | 'approval'
  | 'submitted'
  | 'auction'
  | 'waiting'
  | 'won'
  | 'lost'
  | 'contract';

export interface TenderSummary {
  active_count: number;
  active_sum: number;
  won_count: number;
  won_sum: number;
  win_rate: number;
  auction_now: number;
  pipeline: Record<TenderStage, { count: number; sum_nmc: number }>;
}

export interface TenderTask {
  id: number;
  tender_id: number;
  title: string;
  assignee: string;
  due_date: string;
  status: 'todo' | 'in_progress' | 'done' | 'overdue';
  priority: 'low' | 'medium' | 'high';
}

export interface AuctionBid {
  id: number;
  tender_id: number;
  timestamp: string;
  price: number;
  bidder: string;
}
