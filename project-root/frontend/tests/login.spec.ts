import { test, expect, type Page } from '@playwright/test';

/**
 * Автотесты страницы логина (/login).
 *
 * В отличие от e2e/auth.spec.ts, эти тесты не зависят от запущенного
 * backend: все API-ответы (/auth/login, /auth/me, /meta) мокируются
 * через page.route, поэтому проверяется именно поведение UI.
 */

const TOKENS = { access_token: 'test-access-token', refresh_token: 'test-refresh-token' };
const USER = {
  id: 1,
  email: 'admin@iris.local',
  username: 'admin',
  full_name: 'Администратор',
  role: 'admin',
  is_active: true,
};

/** Мок /api/v1/meta (страница логина читает его для кнопки «Демо-режим»). */
async function mockMeta(page: Page, mode: 'demo' | 'prod' = 'prod') {
  await page.route('**/api/v1/meta', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        mode,
        version: '4.6.0',
        features: {
          demo_data_seed: mode === 'demo',
          exports: mode === 'prod',
          external_integrations: mode === 'prod',
          feedback_button: mode === 'prod',
          demo_banner: mode === 'demo',
        },
      }),
    }),
  );
}

/** Мок успешной авторизации: POST /auth/login + GET /auth/me. */
async function mockLoginSuccess(page: Page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(TOKENS) }),
  );
  await page.route('**/api/v1/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }),
  );
}

/** Мок отказа авторизации (401). */
async function mockLoginFailure(page: Page) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Incorrect email/username or password' }),
    }),
  );
}

test.describe('Страница логина', () => {
  test.beforeEach(async ({ page }) => {
    await mockMeta(page, 'prod');
  });

  test('отображает форму авторизации', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Авторизация' })).toBeVisible();
    await expect(page.getByText('Войдите в систему ДокПоток IRIS')).toBeVisible();
    await expect(page.getByPlaceholder('Введите логин')).toBeVisible();
    await expect(page.getByPlaceholder('Введите пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: /Войти$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Забыли пароль/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Назад/ })).toBeVisible();
  });

  test('кнопка SSO ведёт на SAML-эндпоинт', async ({ page }) => {
    await page.goto('/login');

    const sso = page.getByRole('link', { name: /Войти через SSO/ });
    await expect(sso).toBeVisible();
    await expect(sso).toHaveAttribute('href', '/api/v1/auth/saml/login');
  });

  test('пустая форма не отправляется (HTML5-валидация)', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /Войти$/ }).click();

    // Остаёмся на /login, редиректа нет, поле логина невалидно
    await expect(page).toHaveURL(/.*\/login/);
    const loginInvalid = await page
      .getByPlaceholder('Введите логин')
      .evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(loginInvalid).toBeTruthy();
  });

  test('успешный вход редиректит на /dashboard и сохраняет токены', async ({ page }) => {
    await mockLoginSuccess(page);
    await page.goto('/login');

    await page.getByPlaceholder('Введите логин').fill('admin');
    await page.getByPlaceholder('Введите пароль').fill('admin123');
    await page.getByRole('button', { name: /Войти$/ }).click();

    await expect(page).toHaveURL(/.*\/dashboard/);
    const access = await page.evaluate(() => localStorage.getItem('access_token'));
    const refresh = await page.evaluate(() => localStorage.getItem('refresh_token'));
    expect(access).toBe(TOKENS.access_token);
    expect(refresh).toBe(TOKENS.refresh_token);
  });

  test('логин можно ввести как username и как email', async ({ page }) => {
    let sentBody: any = null;
    await page.route('**/api/v1/auth/login', async (route) => {
      sentBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TOKENS),
      });
    });
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }),
    );
    await page.goto('/login');

    // username (без @) → поле username
    await page.getByPlaceholder('Введите логин').fill('admin');
    await page.getByPlaceholder('Введите пароль').fill('admin123');
    await page.getByRole('button', { name: /Войти$/ }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    expect(sentBody).toEqual({ username: 'admin', password: 'admin123' });
  });

  test('email (с @) отправляется в поле email', async ({ page }) => {
    let sentBody: any = null;
    await page.route('**/api/v1/auth/login', async (route) => {
      sentBody = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TOKENS),
      });
    });
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(USER) }),
    );
    await page.goto('/login');

    await page.getByPlaceholder('Введите логин').fill('admin@iris.local');
    await page.getByPlaceholder('Введите пароль').fill('admin123');
    await page.getByRole('button', { name: /Войти$/ }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    expect(sentBody).toEqual({ email: 'admin@iris.local', password: 'admin123' });
  });

  test('неверный пароль показывает ошибку и остаётся на /login', async ({ page }) => {
    await mockLoginFailure(page);
    await page.goto('/login');

    await page.getByPlaceholder('Введите логин').fill('admin');
    await page.getByPlaceholder('Введите пароль').fill('wrong-password');
    await page.getByRole('button', { name: /Войти$/ }).click();

    await expect(page.getByText('Incorrect email/username or password')).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
    const access = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(access).toBeNull();
  });

  test('переключатель показать/скрыть пароль', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByPlaceholder('Введите пароль');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await passwordInput.fill('secret123');
    // Кнопка-глаз — единственная button без текста внутри формы
    const toggle = page.locator('form button[type="button"]');
    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await toggle.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('кнопка «Демо-режим» скрыта в prod и видна в demo', async ({ page }) => {
    // prod — кнопки нет
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Демо-режим/ })).toHaveCount(0);

    // demo — кнопка появляется
    await page.unroute('**/api/v1/meta');
    await mockMeta(page, 'demo');
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /Демо-режим/ })).toBeVisible();
  });

  test('«Забыли пароль?» ведёт на /forgot-password', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: /Забыли пароль/ }).click();
    await expect(page).toHaveURL(/.*\/forgot-password/);
  });
});

test.describe('Темы на странице логина', () => {
  test.beforeEach(async ({ page }) => {
    await mockMeta(page, 'prod');
  });

  test('при сохранённой sepia логин отображается в светлой теме', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('iris-theme', 'sepia'));
    await page.goto('/login');

    // Эффект LoginPage применяет тему асинхронно после монтирования
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.getAttribute('data-theme')),
      )
      .toBe('light');
    const hasSepia = await page.evaluate(() =>
      document.documentElement.classList.contains('theme-sepia'),
    );
    expect(hasSepia).toBeFalsy();
  });

  test('при сохранённой midnight логин отображается в тёмной теме', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('iris-theme', 'midnight'));
    await page.goto('/login');

    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.getAttribute('data-theme')),
      )
      .toBe('dark');
  });

  test('тема пользователя восстанавливается после входа', async ({ page }) => {
    await mockLoginSuccess(page);
    await page.addInitScript(() => localStorage.setItem('iris-theme', 'sepia'));
    await page.goto('/login');

    await page.getByPlaceholder('Введите логин').fill('admin');
    await page.getByPlaceholder('Введите пароль').fill('admin123');
    await page.getByRole('button', { name: /Войти$/ }).click();

    await expect(page).toHaveURL(/.*\/dashboard/);
    // Дашборд ленивый: пока чанк не загрузится, LoginPage остаётся смонтированной,
    // а её cleanup (восстановление темы) ещё не отрабатывает
    await expect(page.getByRole('heading', { name: 'Авторизация' })).toHaveCount(0, {
      timeout: 15000,
    });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.getAttribute('data-theme')),
      )
      .toBe('sepia');
  });
});
