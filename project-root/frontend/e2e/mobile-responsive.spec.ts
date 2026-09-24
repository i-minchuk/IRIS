import { test, expect, Page } from '@playwright/test';
import { loginViaApi } from './helpers/auth';

/**
 * Mobile / responsive regression tests.
 * Проверяет ключевые страницы на разных viewport'ах.
 * Только Chromium — матрица снапшотов не раздувается.
 */

test.skip(({ browserName }) => browserName !== 'chromium', 'Responsive: chromium only');

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad Mini', width: 768, height: 1024 },
  { name: 'Desktop HD', width: 1280, height: 800 },
] as const;

const PAGES = [
  { path: '/dashboard', marker: /Панель аналитики|dashboard/i },
  { path: '/documents', marker: /Документация|Документы/i },
  { path: '/portfolio', marker: /Портфель заказов|проект/i },
  { path: '/remarks', marker: /Замечани/i },
  { path: '/time-tracking', marker: /Учёт времени|тайм/i },
] as const;

/** Проверка отсутствия горизонтального скролла. */
async function assertNoHorizontalScroll(page: Page, viewportName: string) {
  const hasHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );
  expect(hasHScroll, `Горизонтальный скролл на ${viewportName}`).toBe(false);
}

test.describe('Responsive: viewport matrix', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
      });

      for (const { path, marker } of PAGES) {
        test(`${path} — нет горизонтального скролла и контент виден`, async ({ page }) => {
          await page.goto(path);
          // Ждём появления основного контента
          await expect(
            page.locator('body').getByText(marker).filter({ visible: true }).first()
          ).toBeVisible({ timeout: 15000 });

          // Проверяем отсутствие горизонтального скролла
          await assertNoHorizontalScroll(page, viewport.name);

          // Проверяем, что нет ошибки "Произошла ошибка"
          await expect(page.getByText(/Произошла ошибка/i)).toHaveCount(0);
        });
      }
    });
  }
});

test.describe('Responsive: навигация на мобильном', () => {
  test('бургер-меню или нижняя навигация отображается на 375px', async ({ page }) => {
    await loginViaApi(page);
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    await expect(
      page.locator('body').getByText(/Панель аналитики/i).filter({ visible: true }).first()
    ).toBeVisible({ timeout: 15000 });

    // На мобильном nav должен быть либо бургер, либо нижняя панель
    const navElements = page.locator('nav, header');
    const count = await navElements.count();
    expect(count).toBeGreaterThan(0);

    await assertNoHorizontalScroll(page, 'iPhone SE');
  });

  test('таблица замечаний адаптируется на 390px', async ({ page }) => {
    await loginViaApi(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/remarks');

    await expect(page.getByText(/Замечани/i)).toBeVisible({ timeout: 15000 });

    // Проверяем, что кнопки управления видны
    await expect(page.getByRole('button', { name: /Новое замечание/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Таблица|Kanban|Статистика/i }).first()).toBeVisible();

    await assertNoHorizontalScroll(page, 'iPhone 14');
  });
});
