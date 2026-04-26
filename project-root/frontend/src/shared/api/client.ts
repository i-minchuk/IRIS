// frontend/src/shared/api/client.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Отправляем cookies автоматически
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик для обработки ошибок (например, 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Очищаем состояние
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Редирект на логин
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;