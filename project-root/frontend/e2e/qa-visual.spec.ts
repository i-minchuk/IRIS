import { test, expect, Page } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

/**
 * Визуальные регрессионные тесты (screenshot comparison).
 * Снапшоты лежат в e2e/qa-visual.spec.ts-snapshots/ и зависят от ОС/шрифтов —
 * при переносе на другую машину перегенерировать:
 *   npx playwright test e2e/qa-visual.spec.ts --update-snapshots
 * Только Chromium — иначе матрица снапшотов раздувается.
 */

test.skip(({ browserName }) => browserName !== 'chromium', 'Visual: chromium only');

/** Гасим анимации и убираем динамичные блоки (тосты), ждём стабилизации. */
async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; }
    `,
  });
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toast]').forEach((el) => el.remove());
  });
  await page.waitForTimeout(800);
}

const SHOT_OPTS = {
  fullPage: false,
  maxDiffPixelRatio: 0.02,
};

test.describe('Visual: ключевые экраны', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test('страница логина', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Авторизация/ })).toBeVisible({ timeout: 15000 });
    await stabilize(page);
    await expect(page).toHaveScreenshot('login.png', SHOT_OPTS);
  });

  const PAGES: Array<{ path: string; name: string; marker: RegExp }> = [
    { path: '/dashboard', name: 'dashboard', marker: /Панель аналитики/ },
    { path: '/portfolio', name: 'portfolio', marker: /Портфель заказов/ },
    { path: '/documents', name: 'documents', marker: /Документация|Документы/ },
    { path: '/production', name: 'production', marker: /Производственн/ },
    { path: '/remarks', name: 'remarks', marker: /Замечани/ },
    { path: '/reports', name: 'reports', marker: /Отчёты|Отчеты/ },
    { path: '/admin', name: 'admin', marker: /Администрирование|Обзор/ },
    { path: '/admin/users', name: 'admin-users', marker: /Всего пользователей/ },
    { path: '/admin/audit', name: 'admin-audit', marker: /записей|аудита/iu },
    { path: '/profile', name: 'profile', marker: /Основная информация/ },
    { path: '/team', name: 'team', marker: /Рейтинг, загрузка и достижения команды/ },
    { path: '/time-tracking', name: 'time-tracking', marker: /Учёт времени|тайм/iu },
  ];

  for (const { path, name, marker } of PAGES) {
    test(`экран ${name} (${path})`, async ({ page }) => {
      await loginViaApi(page);
      await page.goto(path);
      await expect(page.locator('body').getByText(marker).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
      await page.waitForTimeout(1500); // догрузка данных
      await stabilize(page);
      await expect(page).toHaveScreenshot(`${name}.png`, SHOT_OPTS);
    });
  }

  test('тёмная тема: dashboard', async ({ page }) => {
    await loginViaApi(page);
    await page.goto('/dashboard');
    await expect(page.locator('body').getByText(/Панель аналитики/).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('iris-theme', 'dark');
    });
    await page.waitForTimeout(800);
    await stabilize(page);
    await expect(page).toHaveScreenshot('dashboard-dark.png', SHOT_OPTS);
  });
});
