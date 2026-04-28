import axios from 'axios';
import * as Sentry from '@sentry/react';


// Use relative paths for API requests - Vite proxy handles routing to backend
const client = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 секунд timeout
});

client.interceptors.request.use((config) => {
  console.log('[API Request]', config.method?.toUpperCase(), config.url);
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    console.log('[API Response]', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Retry для сетевых ошибок (до 3 раз с экспоненциальной задержкой)
    if (
      (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') &&
      !originalRequest._retryCount
    ) {
      originalRequest._retryCount = 0;
    }

    if (originalRequest._retryCount < 3) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount), 10000);

      console.warn(`API retry attempt ${originalRequest._retryCount} in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return client(originalRequest);
    }

    if (error.response?.status >= 500 || !error.response) {
      Sentry.captureException(error);
    }

    // 401 auth handling
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken && !error.config._retry) {
        error.config._retry = true;
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', data.access_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return client(error.config);
        } catch {
          // Refresh failed — silently fail, let the app handle auth state
        }
      }
    }
    return Promise.reject(error);
  }
);

export default client;
