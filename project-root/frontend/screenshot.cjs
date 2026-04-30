const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  });
  
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'admin@iris.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Production with project selected
  await page.goto('http://localhost:5173/production', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  
  // Click on project "Корпус насоса Н-150"
  await page.click('text=Корпус насоса Н-150');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-project-card.png', fullPage: true });
  console.log('Project card screenshot saved');
  
  // Click Operations tab using exact button selector
  await page.click('button:has-text("Операции")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-tab2-operations.png', fullPage: true });
  console.log('Operations screenshot saved');
  
  // Click Workload tab
  await page.click('button:has-text("Загрузка")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-tab3-workload.png', fullPage: true });
  console.log('Workload screenshot saved');
  
  // Click Documents tab
  await page.click('button:has-text("Документы")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-tab4-documents.png', fullPage: true });
  console.log('Documents screenshot saved');
  
  // Click MTO tab
  await page.click('button:has-text("МТО")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'production-tab5-mto.png', fullPage: true });
  console.log('MTO screenshot saved');
  
  await browser.close();
})();
