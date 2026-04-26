// frontend/src/features/auth/api/authApi.ts
import apiClient from '@/shared/api/client';
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '../types';

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await apiClient.post<TokenResponse>('/auth/login', data, {
      withCredentials: true,
    });
    return response.data;
  },

  async register(data: RegisterRequest): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/auth/me', {
      withCredentials: true,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout', {}, { withCredentials: true });
  },
};