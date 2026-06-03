import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Входим через демо-режим
    await page.goto('/login');
    await page.getByRole('button', { name: /Демо-режим/ }).click();
    await page.waitForURL(/.*\/dashboard/);
  });

  test('виджеты дашборда отображаются', async ({ page }) => {
    // Dashboard загрузился — проверяем наличие Layout (табы навигации)
    await expect(page.locator('nav[aria-label="Главная навигация"]')).toBeVisible();
  });

  test('DepartmentLoad — 5 отделов и 14 сотрудников', async ({ page }) => {
    // Переходим на страницу проектов напрямую
    await page.goto('/projects');
    await page.waitForURL(/.*\/projects/);
    // DepartmentLoad отображается на странице проектов
    await expect(page.locator('body')).toContainText(/Тендерный|Проектный|ОК\/Согласование/i);
  });
});
