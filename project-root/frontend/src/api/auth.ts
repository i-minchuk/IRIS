import client from './client';
import type { User, TokenResponse } from '../types';

export const login = async (username: string, password: string): Promise<TokenResponse> => {
  const { data } = await client.post<TokenResponse>('/api/auth/login', { username, password });
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await client.get<User>('/api/auth/me');
  return data;
};

export const updateProfile = async (body: { full_name?: string; email?: string; password?: string }) => {
  const { data } = await client.put('/api/auth/me', body);
  return data;
};
