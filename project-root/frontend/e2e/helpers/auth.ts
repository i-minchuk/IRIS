import { Page, APIResponse } from '@playwright/test';

/**
 * Тестовый пользователь (создан в БД iris_dev):
 * username: qa_tester, роль: admin.
 */
export const QA_USER = {
  username: 'qa_tester',
  password: 'QaTest123!',
};

const BACKEND_URL = process.env.QA_BACKEND_URL || 'http://localhost:8000';

// Кэш токенов на процесс-воркер: /auth/login ограничен 5 запросами/мин,
// без кэша прогон из 14+ тестов упирался бы в 429.
let cachedTokens: { access: string; refresh: string } | null = null;

/**
 * Авторизация через API: получает токены и подкладывает их в localStorage
 * до загрузки приложения. Быстрее и стабильнее логина через UI-форму.
 * Требует запущенный backend на :8000.
 */
export async function loginViaApi(page: Page): Promise<void> {
  if (!cachedTokens) {
    const response: APIResponse = await page.request.post(
      `${BACKEND_URL}/api/v1/auth/login`,
      { data: { username: QA_USER.username, password: QA_USER.password } },
    );
    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }
    const { access_token, refresh_token } = await response.json();
    cachedTokens = { access: access_token, refresh: refresh_token };
  }
  const { access, refresh } = cachedTokens;
  await page.addInitScript(([a, r]) => {
    localStorage.setItem('access_token', a);
    localStorage.setItem('refresh_token', r);
  }, [access, refresh]);
}

/** Сборщик серверных ошибок (5xx) за время теста. */
export function collect5xx(page: Page): string[] {
  const errors: string[] = [];
  page.on('response', (r) => {
    if (r.status() >= 500) errors.push(`${r.status()} ${r.url()}`);
  });
  return errors;
}

/** SPA-навигация без полной перезагрузки (как клик по меню). */
export async function spaGo(page: Page, path: string, waitMs = 2500): Promise<void> {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await page.waitForTimeout(waitMs);
}
