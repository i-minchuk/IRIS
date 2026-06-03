export type ReleaseStatus = 'planning' | 'development' | 'testing' | 'staging' | 'ready' | 'deployed' | 'rolled_back';

export interface ChecklistItem {
  id: string;
  category: string;
  text: string;
  completed: boolean;
  required: boolean;
  assignee?: string;
}

export interface Release {
  id: number;
  version: string;
  name: string;
  branch: string;
  status: ReleaseStatus;
  description: string;
  checklist: ChecklistItem[];
  checklist_progress: number;
  approved_by: string[];
  deployed_at: string | null;
  deployed_by: string | null;
  rollback_info: {
    reason: string;
    rolled_back_at: string;
    rolled_back_by: string;
  } | null;
  created_at: string;
  planned_date: string;
}
