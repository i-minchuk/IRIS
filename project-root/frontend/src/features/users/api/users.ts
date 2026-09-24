import client from '@/shared/api/client';
import type { User } from '@/types';

export interface EmployeeContact {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  position?: string | null;
  department?: string | null;
  phone?: string | null;
}

/** Справочник контактов — доступен всем авторизованным пользователям. */
export const getEmployeeDirectory = async (): Promise<EmployeeContact[]> => {
  const { data } = await client.get('/employees/directory');
  return data;
};

export const getUsers = async (): Promise<User[]> => {
  const { data } = await client.get('/auth/users');
  return data;
};

export const createUser = async (body: { username: string; email: string; password: string; full_name: string; role: string }) => {
  const { data } = await client.post('/api/users/', body);
  return data;
};

export const deactivateUser = async (id: number) => {
  const { data } = await client.put(`/api/users/${id}/deactivate`);
  return data;
};
