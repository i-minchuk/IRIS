import client from './client';
import type { User } from '../types';

export const getUsers = async (): Promise<User[]> => {
  const { data } = await client.get('/api/users/');
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
