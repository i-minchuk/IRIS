/*
 * Регрессионный прогон разделов (CI): логин + обход маршрутов, сбор ошибок консоли.
 * Падает с exit code 1, если на любой странице есть ошибки console/pageerror.
 *
 * Переменные окружения:
 *   BASE_URL — адрес фронтенда (по умолчанию http://localhost:5173)
 *   LOGIN    — логин (по умолчанию demo@iris.local)
 *   PASSWORD — пароль (по умолчанию demo1234)
 */
const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const LOGIN = process.env.LOGIN || 'demo@iris.local';
const PASSWORD = process.env.PASSWORD || 'demo1234';

const ROUTES = [
  ['/dashboard', 'Панель аналитики'],
  ['/documents', 'Документация'],
  ['/portfolio', 'Портфель'],
  ['/production', 'Производственный контроль'],
  ['/archive', 'Архив'],
  ['/references', 'Справочники'],
  ['/reports', 'Отчёты'],
  ['/time-tracking', 'Учёт времени'],
  ['/profile', 'Профиль'],
  ['/notifications', 'Уведомления'],
  ['/ai-search', 'AI-поиск'],
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const failures = [];

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="text"], input:not([type])', LOGIN);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"], button:has-text("Войти")');
  await page.waitForURL(u => !u.pathname.includes('login'), { timeout: 20000 });
  console.log(`авторизация (${LOGIN}): ok`);

  for (const [url, name] of ROUTES) {
    const errs = [];
    const onC = m => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); };
    const onE = e => errs.push('PAGEERROR: ' + String(e).slice(0, 300));
    page.on('console', onC);
    page.on('pageerror', onE);
    try {
      await page.goto(BASE_URL + url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      const len = (await page.evaluate(() => document.body.innerText)).length;
      if (len < 100) errs.push(`страница почти пустая (${len} симв.)`);
    } catch (e) {
      errs.push('навигация: ' + e.message.split('\n')[0]);
    }
    page.off('console', onC);
    page.off('pageerror', onE);
    const status = errs.length === 0 ? '✓' : '✗';
    console.log(`${status} ${name} (${url})`);
    if (errs.length) {
      failures.push({ url, name, errs });
      await page.screenshot({ path: `regression-${url.replace(/\W+/g, '_')}.png` }).catch(() => {});
    }
  }

  await browser.close();

  if (failures.length) {
    console.error('\nПРОГОН ПРОВАЛЕН:');
    for (const f of failures) {
      console.error(`\n${f.name} (${f.url}):`);
      f.errs.forEach(e => console.error('  - ' + e));
    }
    process.exit(1);
  }
  console.log('\nПРОГОН УСПЕШЕН: ошибок нет');
})().catch(e => { console.error('SCRIPT FAIL:', e); process.exit(1); });
