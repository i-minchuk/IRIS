const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  
  // Открываем страницу логина
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  
  // Кликаем "Демо-режим"
  await page.click('text=Демо-режим');
  await page.waitForTimeout(2000);
  
  // Переходим на архив
  await page.goto('http://localhost:5173/archive');
  await page.waitForTimeout(3000);
  
  // Скриншот
  await page.screenshot({ path: 'archive_after_fix.png', fullPage: false });
  
  await browser.close();
})();
