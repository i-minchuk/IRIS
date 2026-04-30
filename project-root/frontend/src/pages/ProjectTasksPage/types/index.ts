/** Task types for Project Tasks Page */

export type TaskType = 'production' | 'document' | 'approval' | 'review' | 'issue' | 'planning' | 'meeting' | 'other';
export type TaskStatus = 'new' | 'in_progress' | 'on_hold' | 'done' | 'cancelled' | 'review' | 'approval';
export type TaskPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Task {
  id: number;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  assigneeId: number | null;
  assigneeName?: string;
  creatorId: number;
  creatorName?: string;
  projectId: number | null;
  projectCode?: string;
  projectName?: string;
  routeId: number | null;
  operationId: number | null;
  operationCode?: string;
  operationName?: string;
  documentId: number | null;
  documentNumber?: string;
  workCenterId: number | null;
  workCenterName?: string;
  estimatedHours: number | null;
  actualHours: number | null;
  percentComplete: number;
  overdueDays: number | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  projectId: number | null;
  assigneeId: number | null;
  status: TaskStatus | null;
  type: TaskType | null;
  priority: TaskPriority | null;
  workCenterId: number | null;
  dueDateFrom: string | null;
  dueDateTo: string | null;
  overdueOnly: boolean;
  search: string;
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  overdueCount: number;
  overduePercentage: number;
  assigneeLoad: Array<{
    assigneeId: number;
    assigneeName?: string;
    taskCount: number;
    overdueCount: number;
  }>;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: number;
  projectId?: number;
  routeId?: number;
  operationId?: number;
  documentId?: number;
  workCenterId?: number;
  estimatedHours?: number;
  metadata?: Record<string, any>;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  type?: TaskType;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  assigneeId?: number;
  projectId?: number;
  routeId?: number;
  operationId?: number;
  documentId?: number;
  workCenterId?: number;
  estimatedHours?: number;
  actualHours?: number;
  percentComplete?: number;
  metadata?: Record<string, any>;
}

export interface TaskStatusUpdateInput {
  status: TaskStatus;
  percentComplete?: number;
  notes?: string;
}
