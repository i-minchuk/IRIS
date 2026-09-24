import { test, expect } from '@playwright/test';
import { loginViaApi, collect5xx, spaGo } from './helpers/auth';
import { apiRequest, getFirstDocument, getFirstProject } from './helpers/api';

/**
 * E2E Remarks — полный жизненный цикл замечания.
 * Требуются: frontend :5173, backend :8000, пользователь qa_tester/admin.
 */

test.describe('Remarks: жизненный цикл', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('создание, комментарий и смена статуса замечания через API + проверка в UI', async ({ page }) => {
    const errors5xx = collect5xx(page);

    // 1. Получаем документ и проект для привязки
    const doc = await getFirstDocument(page);
    const project = doc.project_id ? { id: doc.project_id, name: '' } : await getFirstProject(page);

    // 2. Создаём замечание через API
    const createResp = await apiRequest(page, 'POST', '/api/v1/remarks', {
      data: {
        title: `E2E Remark ${Date.now()}`,
        description: 'Auto-created by E2E test',
        project_id: project.id,
        document_id: doc.id,
        priority: 'high',
        category: 'design',
        source: 'manual',
      },
    });
    expect(createResp.ok()).toBe(true);
    const remark = await createResp.json();
    expect(remark.status).toBe('new');
    expect(remark.title).toContain('E2E Remark');

    // 3. Добавляем комментарий
    const commentResp = await apiRequest(page, 'POST', `/api/v1/remarks/${remark.id}/comments`, {
      data: { text: 'E2E test comment', is_internal: false },
    });
    expect(commentResp.ok()).toBe(true);
    const comment = await commentResp.json();
    expect(comment.text).toBe('E2E test comment');

    // 4. Меняем статус на in_progress (assign)
    const assignResp = await apiRequest(page, 'POST', `/api/v1/remarks/${remark.id}/actions`, {
      data: { action: 'assign', payload: { assignee_id: 1 } },
    });
    expect(assignResp.ok()).toBe(true);
    const assignData = await assignResp.json();
    expect(assignData.new_status).toBe('in_progress');

    // 5. Решаем замечание
    const resolveResp = await apiRequest(page, 'POST', `/api/v1/remarks/${remark.id}/actions`, {
      data: { action: 'resolve', payload: { resolution: 'Fixed in revision 2' } },
    });
    expect(resolveResp.ok()).toBe(true);
    const resolveData = await resolveResp.json();
    expect(resolveData.new_status).toBe('resolved');

    // 6. Проверяем UI — переходим на /remarks
    await page.goto('/remarks');
    await expect(page.getByText(/Замечания|Централизованный учёт/i)).toBeVisible({ timeout: 15000 });

    // Проверяем, что замечание отображается в списке
    await expect(page.getByText(remark.title)).toBeVisible({ timeout: 15000 });

    // Переключаем на Kanban
    await page.getByRole('button', { name: /Kanban/i }).click();
    await expect(page.getByText(remark.title)).toBeVisible({ timeout: 10000 });

    // Переключаем на Статистика
    await page.getByRole('button', { name: /Статистика/i }).click();
    await expect(page.getByText(/Всего:|Статистика/i)).toBeVisible({ timeout: 10000 });

    // 7. Проверяем статистику через API
    const statsResp = await apiRequest(page, 'GET', '/api/v1/remarks/statistics');
    expect(statsResp.ok()).toBe(true);
    const stats = await statsResp.json();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.by_status).toHaveProperty('resolved');

    expect(errors5xx, `5xx errors: ${errors5xx.join(', ')}`).toEqual([]);
  });

  test('список замечаний фильтруется по статусу', async ({ page }) => {
    const resp = await apiRequest(page, 'GET', '/api/v1/remarks', {
      params: { status: 'new', page_size: 10 },
    });
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(Array.isArray(data.remarks)).toBe(true);
    for (const r of data.remarks) {
      expect(r.status).toBe('new');
    }
  });

  test('UI: переключение режимов отображения (table → kanban → stats)', async ({ page }) => {
    await page.goto('/remarks');
    await expect(page.getByText(/Замечания/i)).toBeVisible({ timeout: 15000 });

    // По умолчанию table
    await expect(page.getByRole('button', { name: /Таблица/i })).toBeVisible();

    // Kanban
    await page.getByRole('button', { name: /Kanban/i }).click();
    await expect(page.locator('body')).toContainText(/new|in_progress|resolved|closed/i, { timeout: 10000 });

    // Stats
    await page.getByRole('button', { name: /Статистика/i }).click();
    await expect(page.getByText(/Всего:|по приоритетам|по статусам/i)).toBeVisible({ timeout: 10000 });
  });

  test('UI: экспорт кнопка disabled в демо-режиме или скачивает CSV в проде', async ({ page }) => {
    await page.goto('/remarks');
    await expect(page.getByText(/Замечания/i)).toBeVisible({ timeout: 15000 });

    const exportBtn = page.getByRole('button', { name: /Экспорт/i });
    await expect(exportBtn).toBeVisible();

    // Проверяем tooltip или состояние кнопки
    const isDisabled = await exportBtn.isDisabled();
    if (isDisabled) {
      // Demo mode — кнопка должна быть disabled
      await expect(exportBtn).toHaveAttribute('title', /Недоступно в демо-режиме/i);
    } else {
      // Prod mode — скачиваем CSV
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 10000 }),
        exportBtn.click(),
      ]);
      expect(download.suggestedFilename()).toBe('remarks_export.csv');
    }
  });

  test('404 на несуществующее замечание', async ({ page }) => {
    const resp = await apiRequest(page, 'GET', '/api/v1/remarks/00000000-0000-0000-0000-000000000000');
    expect(resp.status()).toBe(404);
  });
});
