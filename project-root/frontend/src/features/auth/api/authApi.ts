// frontend/src/features/auth/api/authApi.ts
import apiClient from '@/shared/api/client';
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '../types';

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', data.email); // OAuth2 требует 'username'
    formData.append('password', data.password);
    
    const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  async register(data: RegisterRequest): Promise<UserResponse> {
    const response = await apiClient.post<UserResponse>('/auth/register', data);
    return response.data;
  },

  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/auth/me');
    return response.data;
  },
};