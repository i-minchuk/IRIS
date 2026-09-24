import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Мокаем модули ДО импорта apiClient
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/shared/api/authEvents', () => ({
  authEvents: {
    emitLogout: vi.fn(),
  },
}));

import * as Sentry from '@sentry/react';
import { toast } from 'sonner';
import { authEvents } from '@/shared/api/authEvents';

// Динамически импортируем apiClient после настройки моков
let apiClient: ReturnType<typeof axios.create>;

async function createApiClient() {
  // Сбрасываем module cache
  vi.resetModules();
  const mod = await import('@/shared/api/client');
  return mod.default;
}

describe('apiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('request interceptor adds Bearer token from localStorage', async () => {
    localStorage.setItem('access_token', 'my_token');
    apiClient = await createApiClient();

    // Проверяем, что interceptor добавляет заголовок
    const requestConfig = { headers: {} };
    const requestUse = apiClient.interceptors.request as any;
    // Вызываем первый зарегистрированный handler
    const handlers = requestUse.handlers || [];
    expect(handlers.length).toBeGreaterThan(0);
    const result = handlers[0].fulfilled(requestConfig);
    expect(result.headers.Authorization).toBe('Bearer my_token');
  }, 15000);

  it('request interceptor does not add Authorization when no token', async () => {
    apiClient = await createApiClient();
    const requestConfig = { headers: {} };
    const handlers = (apiClient.interceptors.request as any).handlers || [];
    const result = handlers[0].fulfilled(requestConfig);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('shows toast on 403', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: { status: 403, data: {} },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Доступ запрещён');
  });

  it('shows toast on 404', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: { status: 404, data: {} },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Не найдено');
  });

  it('shows toast on 429', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: { status: 429, data: {} },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Слишком много запросов. Попробуйте позже.');
  });

  it('shows toast on server error (5xx)', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: { status: 500, data: {} },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Ошибка сервера. Попробуйте позже.');
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it('logs network errors to Sentry and shows toast', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: undefined,
      code: 'ECONNREFUSED',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('Нет соединения с сервером');
  });

  it('does not show toast on 401 (handled by refresh)', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: { status: 401, data: {} },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    // Без refresh_token должен вызвать emitLogout
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).not.toHaveBeenCalled();
    expect(authEvents.emitLogout).toHaveBeenCalled();
  });

  it('uses custom detail message from response when available', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: { status: 400, data: { detail: 'Custom error message' } },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Custom error message');
  });

  it('uses validation detail array from response', async () => {
    apiClient = await createApiClient();
    const error = {
      config: { _retryCount: 0 },
      response: {
        status: 422,
        data: { detail: [{ msg: 'Field required' }] },
      },
      code: 'ERR_BAD_REQUEST',
    };
    const handlers = (apiClient.interceptors.response as any).handlers || [];
    await expect(handlers[0].rejected(error)).rejects.toBeDefined();
    expect(toast.error).toHaveBeenCalledWith('Field required');
  });
});
