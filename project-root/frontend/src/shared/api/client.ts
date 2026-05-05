import axios from 'axios';
import * as Sentry from '@sentry/react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/authStore';

const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: retry, refresh token, Sentry, logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry для сетевых ошибок (до 3 раз с экспоненциальной задержкой)
    if (
      (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') &&
      originalRequest._retryCount !== undefined &&
      originalRequest._retryCount < 3
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return apiClient(originalRequest);
    }

    // Sentry: логируем 5xx и сетевые ошибки
    if (error.response?.status >= 500 || !error.response) {
      Sentry.captureException(error);
    }

    // User-facing toast for API errors (skip 401 — handled by redirect)
    if (error.response && error.response.status !== 401) {
      const status = error.response.status;
      const data = error.response.data;
      let message = 'Произошла ошибка';
      if (typeof data?.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        message = typeof first === 'string' ? first : first.msg || JSON.stringify(first);
      } else if (typeof data?.message === 'string') {
        message = data.message;
      } else if (status === 403) {
        message = 'Доступ запрещён';
      } else if (status === 404) {
        message = 'Не найдено';
      } else if (status === 422) {
        message = 'Ошибка валидации';
      } else if (status === 429) {
        message = 'Слишком много запросов. Попробуйте позже.';
      } else if (status >= 500) {
        message = 'Ошибка сервера. Попробуйте позже.';
      }
      toast.error(message);
    } else if (!error.response) {
      toast.error('Нет соединения с сервером');
    }

    // 401 auth handling — пробуем refresh token
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', data.access_token);
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient(originalRequest);
        } catch {
          // Refresh failed — clear auth state and redirect to login
          useAuthStore.getState().logout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token or already retried — clear auth state and redirect
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
