// frontend/src/features/auth/api/authApi.ts
import apiClient from '@/shared/api/client';
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from '../types';

export const authApi = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const formData = new FormData();
    formData.append('username', data.email); // OAuth2 требует 'username'
    formData.append('password', data.password);
    
    // Используем cookies по умолчанию (HttpOnly)
    // Для JSON response добавьте: { params: { response_type: 'json' } }
    const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      withCredentials: true, // Важно для cookies
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