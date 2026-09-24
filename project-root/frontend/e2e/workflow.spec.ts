import { test, expect } from '@playwright/test';
import { loginViaApi, collect5xx } from './helpers/auth';
import { apiRequest, getFirstDocument, getFirstProject } from './helpers/api';

/**
 * E2E Workflow — полный цикл согласования документа.
 * Требуются: frontend :5173, backend :8000, пользователь qa_tester/admin.
 */

test.describe('Workflow: полный цикл согласования', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaApi(page);
  });

  test('создание workflow instance и прохождение всех стадий через API + проверка в UI', async ({ page }) => {
    const errors5xx = collect5xx(page);

    // 1. Получаем документ и проект
    const doc = await getFirstDocument(page);
    const project = doc.project_id ? { id: doc.project_id, name: '' } : await getFirstProject(page);

    // 2. Получаем predefined workflow templates
    const tplResp = await apiRequest(page, 'GET', '/api/v1/workflows/templates/predefined');
    expect(tplResp.ok()).toBe(true);
    const templates = await tplResp.json();
    expect(templates.length).toBeGreaterThan(0);
    const template = templates[0]; // "Стандартный"

    // 3. Создаём workflow instance
    const startResp = await apiRequest(page, 'POST', '/api/v1/workflows/start', {
      data: {
        template_id: template.id ?? 1, // если predefined ещё не в БД, используем первый доступный
        document_id: doc.id,
        document_name: doc.name,
        project_id: project.id,
        launch_comment: 'E2E workflow test',
      },
    });

    // Если template_id нет в БД, создаём через templates endpoint
    if (!startResp.ok()) {
      const createTplResp = await apiRequest(page, 'POST', '/api/v1/workflows/templates', {
        data: {
          name: template.name,
          code: `e2e_${Date.now()}`,
          description: template.description,
          steps_schema: template.steps_schema,
          is_default: false,
        },
      });
      expect(createTplResp.ok()).toBe(true);
      const createdTpl = await createTplResp.json();

      const startResp2 = await apiRequest(page, 'POST', '/api/v1/workflows/start', {
        data: {
          template_id: createdTpl.id,
          document_id: doc.id,
          document_name: doc.name,
          project_id: project.id,
          launch_comment: 'E2E workflow test',
        },
      });
      expect(startResp2.ok()).toBe(true);
    }

    // 4. Получаем instance detail
    const instancesResp = await apiRequest(page, 'GET', '/api/v1/workflows/instances', {
      params: { document_id: doc.id, page_size: 10 },
    });
    expect(instancesResp.ok()).toBe(true);
    const instancesData = await instancesResp.json();
    expect(instancesData.instances.length).toBeGreaterThan(0);

    const instance = instancesData.instances[0];
    expect(instance.status).toBe('in_progress');
    expect(instance.steps.length).toBeGreaterThan(0);

    // 5. Проходим все стадии через API
    let currentStep = instance.steps.find((s: any) => s.status === 'pending' || s.status === 'in_progress');
    while (currentStep) {
      const approveResp = await apiRequest(page, 'POST', `/api/v1/workflows/steps/${currentStep.id}/approve`, {
        data: { comment: 'E2E auto-approve' },
      });
      expect(approveResp.ok()).toBe(true);
      const approveData = await approveResp.json();

      if (approveData.workflow_completed) {
        break;
      }

      // Получаем обновлённый instance
      const instResp = await apiRequest(page, 'GET', `/api/v1/workflows/instances/${instance.id}`);
      expect(instResp.ok()).toBe(true);
      const instData = await instResp.json();
      currentStep = instData.steps.find((s: any) => s.status === 'pending' || s.status === 'in_progress');
    }

    // 6. Проверяем audit log
    const auditResp = await apiRequest(page, 'GET', `/api/v1/workflows/audit/${instance.id}`);
    expect(auditResp.ok()).toBe(true);
    const auditData = await auditResp.json();
    expect(auditData.logs.length).toBeGreaterThan(0);
    expect(auditData.logs[0].action).toBeDefined();

    // 7. Проверяем UI — переходим на страницу документа
    await page.goto(`/documents/${doc.id}`);
    // Ждём загрузки контента документа
    await expect(page.locator('body')).toContainText(/Документ|документация|DOC-/i, { timeout: 15000 });

    // Проверяем, что нет 5xx
    expect(errors5xx, `5xx errors: ${errors5xx.join(', ')}`).toEqual([]);
  });

  test('workflow templates endpoint возвращает predefined шаблоны', async ({ page }) => {
    const resp = await apiRequest(page, 'GET', '/api/v1/workflows/templates/predefined');
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(3);
    expect(data[0]).toHaveProperty('code');
    expect(data[0]).toHaveProperty('steps_schema');
  });

  test('workflow instances list фильтруется по document_id', async ({ page }) => {
    const doc = await getFirstDocument(page);
    const resp = await apiRequest(page, 'GET', '/api/v1/workflows/instances', {
      params: { document_id: doc.id, page_size: 20 },
    });
    expect(resp.ok()).toBe(true);
    const data = await resp.json();
    expect(Array.isArray(data.instances)).toBe(true);
    // Все instances должны быть для этого документа (если фильтр работает)
    for (const inst of data.instances) {
      expect(inst.document_id).toBe(doc.id);
    }
  });
});
