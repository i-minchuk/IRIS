import { test, expect } from '@playwright/test';
import { loginViaApi, collect5xx, spaGo, QA_USER } from './helpers/auth';

/**
 * UI/UX регрессионный набор по итогам QA-аудита (QA_REPORT.md).
 * Требуются: frontend :5173 (поднимается webServer'ом), backend :8000,
 * пользователь qa_tester/QaTest123! с ролью admin.
 * Прогон только в Chromium — логика приложения, а не кросс-браузерность.
 */

test.skip(({ browserName }) => browserName !== 'chromium', 'QA suite: chromium only');

test.describe('UI/UX: навигация и доступность разделов', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  const SECTIONS: Array<{ path: string; marker: RegExp }> = [
    { path: '/dashboard', marker: /Панель аналитики|Стратегическая сводка/ },
    { path: '/portfolio', marker: /Портфель заказов/ },
    { path: '/documents', marker: /Документация|Документы/ },
    { path: '/production', marker: /Производственн/ },
    { path: '/archive', marker: /Архив/ },
    { path: '/admin', marker: /Администрирование|Обзор/ },
    { path: '/references', marker: /Справочники/ },
    { path: '/reports', marker: /Отчёты|Отчеты/ },
    { path: '/profile', marker: /Основная информация|Профиль/ },
    { path: '/notifications', marker: /уведомлен/iu },
    { path: '/time-tracking', marker: /Учёт времени|Таймер|тайм/u },
    { path: '/integrations', marker: /Интеграции/ },
    { path: '/ai-search', marker: /поиск/iu },
    { path: '/team', marker: /Рейтинг, загрузка и достижения команды/ },
    { path: '/achievements', marker: /Достижен/ },
    { path: '/remarks', marker: /Замечани/ },
    { path: '/monitoring', marker: /Мониторинг/ },
  ];

  for (const { path, marker } of SECTIONS) {
    test(`раздел ${path} открывается без ошибок и 5xx`, async ({ page }) => {
      const errors5xx = collect5xx(page);
      // Прямой переход = полная загрузка приложения (проверка гидратации)
      await page.goto(path);
      await expect(page.locator('body').getByText(marker).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Произошла ошибка')).toHaveCount(0);
      expect(errors5xx, `5xx на ${path}: ${errors5xx.join(', ')}`).toEqual([]);
    });
  }

  test('F5 / перезагрузка не вешает приложение', async ({ page }) => {
    for (const path of ['/dashboard', '/documents', '/reports']) {
      const nav = page.locator('body').getByText(/Документация|Отчёты|Панель аналитики/).filter({ visible: true }).first();
      await page.goto(path);
      await expect(nav).toBeVisible({ timeout: 15000 });
      await page.reload();
      // Раньше здесь навсегда оставался спиннер «Загрузка…»
      await expect(nav).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Загрузка…')).toHaveCount(0, { timeout: 15000 });
    }
  });

  test('/calendar не отдаёт 404 (редирект на dashboard)', async ({ page }) => {
    await page.goto('/calendar');
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('негоризонтальный скролл на всех ширинах (адаптивность)', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('body').getByText(/Панель аналитики/).filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });
    for (const width of [768, 1024, 1280, 1536, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(600);
      const noHScroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      expect(noHScroll, `горизонтальный скролл при ширине ${width}px`).toBe(true);
    }
  });
});

test.describe('UI/UX: ключевые пользовательские сценарии', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('логин через UI-форму', async ({ page }) => {
    await page.goto('/login');
    await page.locator('form input').first().fill(QA_USER.username);
    await page.locator('form input[type="password"]').first().fill(QA_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });
  });

  test('админ видит список пользователей (без 403)', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByText('Admin access required')).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText(/Всего пользователей:\s*[1-9]/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('qa@test.local')).toBeVisible();
  });

  test('профиль: сохранение переживает перезагрузку', async ({ page }) => {
    const newName = `QA Tester e2e ${Date.now() % 100000}`;
    await page.goto('/profile');
    const nameInput = page.locator('input[value*="QA Tester"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    const original = await nameInput.inputValue();
    await nameInput.fill(newName);
    await page.getByRole('button', { name: /Сохранить/ }).click();
    await expect(page.getByText('Профиль сохранён')).toBeVisible({ timeout: 10000 });

    await page.reload();
    const reread = page.locator(`input[value="${newName}"]`);
    await expect(reread, 'после F5 значение должно сохраниться').toBeVisible({ timeout: 15000 });

    // Возвращаем исходное имя
    await reread.fill(original);
    await page.getByRole('button', { name: /Сохранить/ }).click();
    await expect(page.getByText('Профиль сохранён')).toBeVisible({ timeout: 10000 });
  });

  test('замечания: экспорт скачивает CSV', async ({ page }) => {
    await page.goto('/remarks');
    const exportBtn = page.getByRole('button', { name: /Экспорт/ });
    await expect(exportBtn).toBeVisible({ timeout: 15000 });
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      exportBtn.click(),
    ]);
    expect(download.suggestedFilename()).toBe('remarks_export.csv');
  });

  test('документы: поиск находит документы', async ({ page }) => {
    await page.goto('/documents');
    const search = page.getByPlaceholder(/Поиск/iu).first();
    await expect(search).toBeVisible({ timeout: 15000 });
    await search.fill('КЖ');
    await page.waitForTimeout(1500);
    await expect(page.getByText(/КЖ/).first()).toBeVisible();
  });

  test('блок «Рекомендации IRIS» промаркирован как Демо', async ({ page }) => {
    await page.goto('/dashboard');
    const block = page.getByText('Рекомендации IRIS').first();
    await expect(block).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Демо', { exact: true }).first()).toBeVisible();
  });

  test('empty-states содержат пояснения', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.getByText(/появятся события после архивации/)).toBeVisible({ timeout: 15000 });
    await spaGo(page, '/notifications');
    await expect(page.getByText(/появятся уведомления/)).toBeVisible({ timeout: 15000 });
  });
});
