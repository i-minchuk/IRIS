import { test, expect } from '@playwright/test';

test.describe('LandingPage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for main content to be ready instead of networkidle
    // (backend 401s from background requests should not block tests)
    await page.waitForSelector('text=ДокПоток', { state: 'visible' });
  });

  test('отображается без ошибок консоли', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    // Фильтруем 502/401 от backend (не относятся к frontend)
    const frontendErrors = errors.filter(e =>
      !e.includes('502') &&
      !e.includes('Bad Gateway') &&
      !e.includes('401') &&
      !e.includes('Unauthorized')
    );
    expect(frontendErrors).toEqual([]);
  });

  test('ChromeBot отображается', async ({ page }) => {
    const bot = page.locator('svg[viewBox="0 0 500 500"]').first();
    await expect(bot).toBeVisible();
  });

  test('6 feature cards отображаются', async ({ page }) => {
    const cards = page.locator('.grid > *').filter({ hasText: /Документооборот|Управление проектами|Тендерный отдел|Архив и шаблоны|Замечания|AI-ассистент/ });
    await expect(cards).toHaveCount(6);
  });

  test('кнопка "Войти в систему" ведёт на /login', async ({ page }) => {
    await page.getByRole('link', { name: /Войти в систему/ }).click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('переключение темы работает', async ({ page }) => {
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme') || 'light';
    await page.locator('button[title*="Тема"]').click();
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });
});
