export interface TenderDetail {
  tender: {
    id: number;
    name: string;
    customer_name: string;
    project_type: string;
    volume?: number | null;
    volume_unit?: string;
    complexity: string;
    standards?: string[] | null;
    scope_items?: string[] | null;
    standard_files?: { standard: string; file_name: string; stored_name: string }[] | null;
    stage: string;
    status: string;
    nmc?: number | null;
    our_price?: number | null;
    margin_pct?: number | null;
    probability?: number | null;
    platform?: string;
    region?: string;
    deadline?: string | null;
    auction_end_time?: string | null;
    calculated_hours?: number | null;
    calculated_cost?: number | null;
    team_size?: number | null;
    team_composition?: Record<string, number> | null;
    loss_reason?: string;
    created_at?: string;
  };
  project: {
    id: number;
    name: string;
    code: string;
    status: string;
    stage: string;
    progress_pct: number;
  } | null;
  tasks: {
    id: number;
    title: string;
    status: string;
    priority: string;
    due_date?: string;
    assignee: string | null;
    assignee_id?: number;
    percent_complete: number;
  }[];
  documents: {
    id: number;
    number: string;
    name: string;
    doc_type: string;
    status: string;
    crs_code: string;
    created_at?: string;
  }[];
  workflows: {
    id: number;
    status: string;
    document_name: string | null;
    steps: {
      id: number;
      name: string;
      status: string;
      role: string | null;
      order: number;
    }[];
  }[];
}

export interface TeamAvailability {
  tender_id: number;
  tender_name: string;
  required_hours?: number;
  required_team_size?: number;
  team_members: {
    id: number;
    full_name: string;
    role: string;
    department: string;
    load_pct: number;
    availability: 'free' | 'partial' | 'busy';
    active_tasks: number;
    total_hours_assigned: number;
    available_from: string;
    skills: string[];
  }[];
  recommended_assignment: {
    role: string;
    needed: number;
    candidates: {
      id: number;
      full_name: string;
      role: string;
      department: string;
      load_pct: number;
      availability: string;
      active_tasks: number;
      total_hours_assigned: number;
      available_from: string;
      skills: string[];
    }[];
  }[];
}

export interface ProductionCapacity {
  tender_id: number;
  tender_hours: number;
  work_centers: {
    id: number;
    code: string;
    name: string;
    type: string;
    utilization_pct: number;
    active_operations: number;
    planned_hours: number;
    actual_hours: number;
    capacity_hours: number;
    manager: string | null;
  }[];
  summary: {
    total_capacity_hours: number;
    total_utilized_hours: number;
    remaining_hours: number;
    tender_impact_pct: number;
    risk: 'low' | 'medium' | 'high';
  };
}

export interface DocumentChecklist {
  tender_id: number;
  project_type: string;
  items: {
    code: string;
    name: string;
    required: boolean;
    category: string;
    status: 'done' | 'pending' | 'in_progress';
    documents: {
      id: number;
      number: string;
      name: string;
      status: string;
      crs_code: string;
    }[];
  }[];
  summary: {
    total: number;
    required: number;
    completed: number;
    progress_pct: number;
  };
}

export interface ProcurementStatus {
  tender_id: number;
  tender_name: string;
  materials: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    status: 'pending' | 'ordered' | 'in_transit' | 'delivered' | 'cancelled';
    estimated_cost: number;
    supplier: string | null;
    delivery_date: string | null;
    warehouse_location: string | null;
  }[];
  summary: {
    total_items: number;
    ordered: number;
    delivered: number;
    total_cost: number;
  };
}

export interface ReferenceLibrary {
  tender_id: number;
  project_type: string;
  references: {
    id: number;
    name: string;
    customer_name: string;
    volume?: number;
    volume_unit?: string;
    nmc?: number;
    our_price?: number;
    margin_pct?: number;
    calculated_hours?: number;
    team_size?: number;
    team_composition: Record<string, number>;
    duration_months?: number;
    stage: string;
    created_at?: string;
    similarity_score: number;
  }[];
  stats: {
    avg_margin: number;
    avg_hours: number;
    avg_duration: number;
  };
}
