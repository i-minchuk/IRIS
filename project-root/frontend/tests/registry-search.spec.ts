import { test, expect, type Page } from '@playwright/test';

/**
 * Автотест кнопки «Найти» в реестре документов (/documents).
 * Все API мокируются через page.route — backend не нужен.
 */

const USER = {
  id: 1,
  email: 'admin@iris.local',
  username: 'admin',
  full_name: 'Администратор',
  role: 'admin',
  is_active: true,
};

const PROJECTS = { items: [{ id: 1, name: 'Проект Альфа', status: 'active' }] };

const DOCS = {
  items: [
    { id: 1, number: 'ЧТ-001', name: 'Чертёж общего вида', doc_type: 'drawing', status: 'approved', project_id: 1, created_at: '2026-09-01T10:00:00' },
    { id: 2, number: 'СП-002', name: 'Спецификация оборудования', doc_type: 'specification', status: 'in_review', project_id: 1, created_at: '2026-09-02T10:00:00' },
    { id: 3, number: 'ВО-003', name: 'Ведомость объёмов работ', doc_type: 'statement', status: 'new', project_id: 1, created_at: '2026-09-03T10:00:00' },
  ],
};

async function mockApi(page: Page) {
  // Fallback для любых незамоканных /api/v1/** запросов (регистрируется первым —
  // Playwright выбирает последний зарегистрированный совпавший маршрут)
  await page.route('**/api/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[],"total":0}' }),
  );
  await page.route('**/api/v1/meta', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mode: 'prod',
        version: '4.7.0',
        features: { demo_data_seed: false, exports: true, external_integrations: true, feedback_button: true, demo_banner: false },
      }),
    }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }),
  );
  await page.route('**/api/v1/documents**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DOCS) }),
  );
  await page.route('**/api/v1/projects**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PROJECTS) }),
  );
  await page.route('**/api/v1/gamification/leaderboard**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) }),
  );
}

test.describe('Реестр документов — кнопка «Найти»', () => {
  test.beforeEach(async ({ page }) => {
    page.on('response', (res) => {
      if (res.url().includes('/api/v1/') && !res.ok()) {
        console.log('API FAIL:', res.status(), res.url());
      }
    });
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'test-access-token');
      localStorage.setItem('refresh_token', 'test-refresh-token');
    });
    await mockApi(page);
    await page.goto('/documents');
    // Все три документа видны в центральной панели
    await expect(page.getByText('Чертёж общего вида')).toBeVisible();
    await expect(page.getByText('Спецификация оборудования')).toBeVisible();
    await expect(page.getByText('Ведомость объёмов работ')).toBeVisible();
  });

  test('ввод запроса без клика не фильтрует список', async ({ page }) => {
    await page.getByPlaceholder('Поиск по коду, названию или проекту...').fill('Спецификация');
    // Отложенный поиск: до нажатия «Найти» список не меняется
    await expect(page.getByText('Чертёж общего вида')).toBeVisible();
    await expect(page.getByText('Ведомость объёмов работ')).toBeVisible();
  });

  test('клик «Найти» фильтрует документы по названию', async ({ page }) => {
    await page.getByPlaceholder('Поиск по коду, названию или проекту...').fill('Спецификация');
    await page.getByRole('button', { name: /Найти/ }).click();
    await expect(page.getByText('Спецификация оборудования')).toBeVisible();
    await expect(page.getByText('Чертёж общего вида')).toHaveCount(0);
    await expect(page.getByText('Ведомость объёмов работ')).toHaveCount(0);
  });

  test('клик «Найти» фильтрует по коду документа', async ({ page }) => {
    await page.getByPlaceholder('Поиск по коду, названию или проекту...').fill('во-003');
    await page.getByRole('button', { name: /Найти/ }).click();
    await expect(page.getByText('Ведомость объёмов работ')).toBeVisible();
    await expect(page.getByText('Чертёж общего вида')).toHaveCount(0);
  });

  test('Enter в поле поиска применяет поиск', async ({ page }) => {
    await page.getByPlaceholder('Поиск по коду, названию или проекту...').fill('ЧТ-001');
    await page.getByPlaceholder('Поиск по коду, названию или проекту...').press('Enter');
    await expect(page.getByText('Чертёж общего вида')).toBeVisible();
    await expect(page.getByText('Спецификация оборудования')).toHaveCount(0);
  });

  test('очистка запроса и повторный «Найти» возвращает весь список', async ({ page }) => {
    const input = page.getByPlaceholder('Поиск по коду, названию или проекту...');
    await input.fill('Спецификация');
    await page.getByRole('button', { name: /Найти/ }).click();
    await expect(page.getByText('Чертёж общего вида')).toHaveCount(0);

    await input.fill('');
    await page.getByRole('button', { name: /Найти/ }).click();
    await expect(page.getByText('Чертёж общего вида')).toBeVisible();
    await expect(page.getByText('Спецификация оборудования')).toBeVisible();
    await expect(page.getByText('Ведомость объёмов работ')).toBeVisible();
  });
});
