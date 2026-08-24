import type {
  Department,
  Employee,
  BpmnNode,
  BpmnEdge,
  Problem,
  DepartmentKey,
} from './types';

export const OE = 50;   // ширина полосы отдела
export const GS = 1200; // ширина зоны диаграммы
export const BD = 650;  // высота диаграммы

// Источника данных о производственном процессе (схема BPMN, KPI задач,
// проблемы, занятость сотрудников) в backend нет — данные не выдумываем,
// вкладка показывает empty-state до появления реального источника.
export const DEPARTMENTS: Department[] = [];

export const DEPARTMENT_BY_KEY: Record<DepartmentKey, Department> = DEPARTMENTS.reduce(
  (acc, d) => ({ ...acc, [d.key]: d }),
  {} as Record<DepartmentKey, Department>
);

export const EMPLOYEES: Employee[] = [];

export const BPMN_NODES: BpmnNode[] = [];

export const BPMN_EDGES: BpmnEdge[] = [];

export const PROBLEMS: Problem[] = [];
