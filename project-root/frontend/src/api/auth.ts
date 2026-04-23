import client from './client';
import type { User, TokenResponse } from '../types';

export const login = async (email: string, password: string): Promise<TokenResponse> => {
  const { data } = await client.post<TokenResponse>('/api/v1/auth/login', { email, password });
  return data;
};

export const getMe = async (): Promise<User> => {
  const { data } = await client.get<User>('/api/v1/auth/me');
  return data;
};

export const updateProfile = async (body: { full_name?: string; email?: string; password?: string }) => {
  const { data } = await client.put('/api/v1/auth/me', body);
  return data;
};
