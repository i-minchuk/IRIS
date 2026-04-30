const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@iris.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  await page.goto('http://localhost:5173/production', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-light-tab1.png', fullPage: true });
  
  await page.click('button:has-text("Операции")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-light-tab2.png', fullPage: true });
  
  await page.click('button:has-text("Загрузка")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-light-tab3.png', fullPage: true });
  
  await page.click('button:has-text("Документы")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-light-tab4.png', fullPage: true });
  
  await page.click('button:has-text("МТО")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-light-tab5.png', fullPage: true });
  
  await browser.close();
})();
