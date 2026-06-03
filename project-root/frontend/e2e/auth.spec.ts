import { test, expect } from '@playwright/test';

test.describe('Auth + Demo Mode', () => {
  test('страница логина отображается', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Авторизация/ })).toBeVisible();
    await expect(page.getByPlaceholder(/Введите логин/)).toBeVisible();
    await expect(page.getByPlaceholder(/Введите пароль/)).toBeVisible();
  });

  test('демо-режим входит без сервера', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Демо-режим/ }).click();
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText(/Панель управления|Демо Пользователь/)).toBeVisible();
  });

  test('выход из демо-режима возвращает на /login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /Демо-режим/ }).click();
    await page.waitForURL(/.*\/dashboard/);
    await page.waitForTimeout(500);
    // Закрыть toast-уведомления (sonner overlay)
    await page.evaluate(() => {
      document.querySelectorAll('[data-sonner-toast]').forEach(el => el.remove());
    });
    await page.locator('button[aria-haspopup="menu"]').last().click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: /Выйти/ }).first().click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('реальный логин с backend работает', async ({ page }) => {
    await page.goto('/login');
    
    // Логируем network requests
    const requests: any[] = [];
    page.on('requestfinished', async (req) => {
      if (req.url().includes('/api/v1/auth/')) {
        const resp = await req.response();
        requests.push({
          url: req.url(),
          postData: req.postData(),
          status: resp?.status(),
          body: await resp?.text().catch(() => ''),
        });
      }
    });
    
    await page.getByPlaceholder(/Введите логин/).fill('admin');
    await page.getByPlaceholder(/Введите пароль/).fill('admin123');
    await page.getByRole('button', { name: /Войти/ }).click();
    
    await page.waitForTimeout(3000);
    
    console.log('Auth requests:', JSON.stringify(requests, null, 2));
    console.log('Current URL:', page.url());
    
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.getByText(/Администратор|admin/)).toBeVisible();
  });

  test('реальный логин с неверным паролем показывает ошибку', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/Введите логин/).fill('admin');
    await page.getByPlaceholder(/Введите пароль/).fill('wrongpassword');
    await page.getByRole('button', { name: /Войти/ }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Incorrect email\/username or password|Ошибка входа/)).toBeVisible();
  });
});
