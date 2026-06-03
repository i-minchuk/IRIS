import { test, expect } from '@playwright/test';

test.describe('Layout + Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Входим через демо-режим
    await page.goto('/login');
    await page.getByRole('button', { name: /Демо-режим/ }).click();
    await page.waitForURL(/.*\/dashboard/);
  });

  test('5 табов навигации отображаются', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Главная навигация"]');
    await expect(nav).toBeVisible();
    const tabs = nav.locator('a');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('глобальный поиск работает', async ({ page }) => {
    const search = page.locator('input[placeholder*="Поиск"]');
    await expect(search).toBeVisible();
    await search.fill('тест');
    await expect(search).toHaveValue('тест');
  });

  test('переключение темы в Layout', async ({ page }) => {
    const html = page.locator('html');
    const before = await html.getAttribute('data-theme') || 'light';
    // Дождаться пока toast-уведомления исчезнут (sonner auto-dismiss)
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      document.querySelectorAll('[data-sonner-toast]').forEach(el => el.remove());
    });
    // Click theme button (the one with Sparkles/Moon/Sun icon, not user menu)
    await page.locator('header button[title^="Тема:"]').click();
    await page.waitForTimeout(300);
    // Click on a theme different from current (e.g., if light → dark)
    const targetTheme = before === 'light' ? 'Тёмная' : 'Светлая';
    await page.getByRole('menuitem', { name: targetTheme }).click();
    const after = await html.getAttribute('data-theme');
    expect(after).not.toBe(before);
  });

  test('роутинг на /projects работает', async ({ page }) => {
    // Переходим напрямую на страницу проектов
    await page.goto('/projects');
    await page.waitForURL(/.*\/projects/);
    // Проверяем, что страница загрузилась (любой контент проектов)
    await expect(page.locator('body')).toContainText(/проект|заказ|тендер|документ/i);
  });

  test('404 страница для неизвестных роутов', async ({ page }) => {
    await page.goto('/nonexistent-page');
    await expect(page.getByText(/404|Не найдено|Страница не существует/i)).toBeVisible();
  });
});
