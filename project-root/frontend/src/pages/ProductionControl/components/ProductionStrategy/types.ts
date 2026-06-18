export type DepartmentKey = 'sales' | 'design' | 'supply' | 'assembly' | 'shipping';
export type NodeType = 'event' | 'gateway' | 'task';
export type IssueType = 'ok' | 'bottleneck' | 'duplicate';
export type EdgeType = 'sequence' | 'conditional' | 'message';
export type KpiStatus = 'ok' | 'warn' | 'crit';
export type Severity = 'crit' | 'warn';

export interface Department {
  key: DepartmentKey;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  employees: string[];
  laneY: number;
  laneH: number;
}

export interface NodeKpi {
  label: string;
  value: string;
  status: KpiStatus;
}

export interface BpmnNode {
  id: string;
  label: string;
  dept: DepartmentKey;
  x: number;
  y: number;
  w: number;
  h: number;
  type: NodeType;
  issue: IssueType;
  docs: string[];
  employees: string[];
  kpis: NodeKpi[];
  description: string;
  avgDays: number;
}

export interface BpmnEdge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  label?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  dept: DepartmentKey;
  kpiLoad: number;
  tasks: string[];
}

export interface Problem {
  id: string;
  title: string;
  severity: Severity;
  tasks: string[];
  description: string;
  recommendation: string;
}
