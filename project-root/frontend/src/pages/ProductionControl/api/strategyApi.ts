import client from '@/shared/api/client';
import type {
  Department,
  Employee,
  BpmnNode,
  BpmnEdge,
  Problem,
} from '../components/ProductionStrategy/types';

export interface StrategyData {
  departments: Department[];
  employees: Employee[];
  nodes: BpmnNode[];
  edges: BpmnEdge[];
  problems: Problem[];
}

export const getStrategy = async (): Promise<StrategyData> => {
  const { data } = await client.get('/production/strategy');
  return data;
};

/** Заполняет БД базовым процессом, если она пуста (идемпотентно). */
export const seedStrategy = async (): Promise<StrategyData> => {
  const { data } = await client.post('/production/strategy/seed');
  return data;
};

/** Привязывает/отвязывает сотрудника процесса к учётной записи пользователя. */
export const updateEmployee = async (
  empId: string,
  body: { userId?: number | null },
): Promise<Employee> => {
  const { data } = await client.patch(`/production/employees/${empId}`, body);
  return data;
};
