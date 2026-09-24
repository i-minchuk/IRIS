import { Page, APIResponse } from '@playwright/test';

const BACKEND_URL = process.env.QA_BACKEND_URL || 'http://localhost:8000';

/** Выполнить авторизованный API-запрос через page.request с Bearer-токеном. */
export async function apiRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  endpoint: string,
  options?: { data?: Record<string, unknown>; params?: Record<string, string | number | boolean> }
): Promise<APIResponse> {
  // Получаем токен из localStorage (установлен loginViaApi)
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  if (!token) {
    throw new Error('No access_token in localStorage; call loginViaApi first');
  }

  const url = new URL(`${BACKEND_URL}${endpoint}`);
  if (options?.params) {
    for (const [k, v] of Object.entries(options.params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const requestOptions: Parameters<Page['request'][string]>[1] = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (options?.data) {
    requestOptions.data = options.data;
  }

  return page.request[method.toLowerCase() as 'get' | 'post' | 'patch' | 'put' | 'delete'](
    url.toString(),
    requestOptions
  );
}

/** Получить первый документ из реестра через API. */
export async function getFirstDocument(page: Page): Promise<{ id: number; name: string; project_id: number | null }> {
  const resp = await apiRequest(page, 'GET', '/api/v1/documents');
  if (!resp.ok()) throw new Error(`Failed to fetch documents: ${resp.status()}`);
  const data = await resp.json();
  const doc = data.items?.[0];
  if (!doc) throw new Error('No documents found');
  return { id: doc.id, name: doc.name, project_id: doc.project_id };
}

/** Получить первый проект из реестра через API. */
export async function getFirstProject(page: Page): Promise<{ id: number; name: string }> {
  const resp = await apiRequest(page, 'GET', '/api/v1/projects');
  if (!resp.ok()) throw new Error(`Failed to fetch projects: ${resp.status()}`);
  const data = await resp.json();
  const proj = data.items?.[0];
  if (!proj) throw new Error('No projects found');
  return { id: proj.id, name: proj.name };
}
