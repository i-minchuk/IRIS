# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: navigation.spec.ts >> Layout + Navigation >> переключение темы в Layout
- Location: e2e\navigation.spec.ts:26:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('header button[title^="Тема:"]')
    - locator resolved to <button type="button" aria-haspopup="menu" aria-expanded="false" title="Тема: Светлая (Ctrl+T)" aria-label="Текущая тема: Светлая" class="flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">−</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">+</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">−</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    12 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">−</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">+</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">−</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">−</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">−</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <button class="flex h-5 w-4 items-center justify-center text-sm font-medium transition-colors rounded">+</button> from <div class="flex items-center gap-1 px-2 py-1 rounded-md">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - banner [ref=e5]:
          - generic [ref=e6]:
            - link "ДокПоток IRIS ДокПоток IRIS" [ref=e7] [cursor=pointer]:
              - /url: /dashboard
              - img "ДокПоток IRIS" [ref=e8]
              - generic [ref=e9]:
                - generic [ref=e10]: ДокПоток
                - generic [ref=e11]: IRIS
            - generic [ref=e12]:
              - generic [ref=e13]:
                - img [ref=e14]
                - button "−" [ref=e17] [cursor=pointer]
                - button "+" [ref=e22] [cursor=pointer]
                - generic [ref=e23]: 100%
              - 'button "Текущая тема: Светлая" [ref=e25] [cursor=pointer]':
                - img [ref=e26]
              - button "Уведомления" [ref=e33] [cursor=pointer]:
                - img [ref=e34]
              - button [ref=e38] [cursor=pointer]:
                - img [ref=e40]
                - img [ref=e43]
        - generic [ref=e46]:
          - navigation "Главная навигация" [ref=e47]:
            - button "Меню" [ref=e48] [cursor=pointer]:
              - img [ref=e49]
            - link [ref=e50] [cursor=pointer]:
              - /url: /dashboard
              - img [ref=e53]
            - link [ref=e56] [cursor=pointer]:
              - /url: /tenders
              - img [ref=e59]
            - link [ref=e65] [cursor=pointer]:
              - /url: /portfolio
              - img [ref=e68]
            - link [ref=e70] [cursor=pointer]:
              - /url: /project-portfolio
              - img [ref=e73]
            - link [ref=e76] [cursor=pointer]:
              - /url: /project-tasks
              - img [ref=e79]
            - link [ref=e82] [cursor=pointer]:
              - /url: /package
              - img [ref=e85]
            - link [ref=e89] [cursor=pointer]:
              - /url: /documents
              - img [ref=e92]
            - link [ref=e95] [cursor=pointer]:
              - /url: /production
              - img [ref=e98]
            - link [ref=e100] [cursor=pointer]:
              - /url: /workflow
              - img [ref=e103]
            - link [ref=e106] [cursor=pointer]:
              - /url: /archive
              - img [ref=e109]
            - link [ref=e112] [cursor=pointer]:
              - /url: /achievements
              - img [ref=e115]
            - link [ref=e121] [cursor=pointer]:
              - /url: /calendar
              - img [ref=e124]
            - link [ref=e126] [cursor=pointer]:
              - /url: /admin
              - img [ref=e129]
            - link [ref=e131] [cursor=pointer]:
              - /url: /references
              - img [ref=e134]
            - link [ref=e136] [cursor=pointer]:
              - /url: /reports
              - img [ref=e139]
          - generic [ref=e142]:
            - img
            - textbox "Глобальный поиск (Ctrl+K)" [ref=e143]:
              - /placeholder: Поиск (Ctrl+K)
      - main [ref=e144]:
        - generic [ref=e145]:
          - generic [ref=e146]: Не удалось загрузить данные с сервера. Отображаются демонстрационные значения.
          - generic [ref=e147]:
            - generic [ref=e148]:
              - generic [ref=e149]:
                - generic [ref=e150]:
                  - heading "Панель управления" [level=1] [ref=e151]
                  - paragraph [ref=e152]: Стратегическая сводка по финансам, тендерам и проектам
                - generic [ref=e154]:
                  - button "Сегодня" [ref=e155] [cursor=pointer]
                  - button "Неделя" [ref=e156] [cursor=pointer]
                  - button "Месяц" [ref=e157] [cursor=pointer]
                  - button "Квартал" [ref=e158] [cursor=pointer]
              - generic [ref=e159]:
                - generic [ref=e160] [cursor=pointer]:
                  - generic [ref=e161]:
                    - img [ref=e162]
                    - generic [ref=e164]: Утвердить смету ТЭЦ-5
                    - generic [ref=e165]: Сегодня
                  - button "Подписать" [ref=e166]
                - generic [ref=e167] [cursor=pointer]:
                  - generic [ref=e168]:
                    - img [ref=e169]
                    - generic [ref=e171]: Согласовать КП «Меридиан»
                    - generic [ref=e172]: Завтра
                  - button "Открыть" [ref=e173]
                - generic [ref=e174] [cursor=pointer]:
                  - generic [ref=e175]:
                    - img [ref=e176]
                    - generic [ref=e178]: Подписать доп. №4 к договору
                    - generic [ref=e179]: "25.05"
                  - button "Перейти" [ref=e180]
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - generic [ref=e183]:
                    - generic [ref=e184]: Выручка (план)
                    - img [ref=e185]
                  - generic [ref=e187]:
                    - text: "124.7"
                    - generic [ref=e188]: / 150 млн ₽
                  - generic [ref=e189]:
                    - img [ref=e190]
                    - text: +12%
                - generic [ref=e193]:
                  - generic [ref=e194]:
                    - generic [ref=e195]: Прибыль (план)
                    - img [ref=e196]
                  - generic [ref=e199]:
                    - text: "18.3"
                    - generic [ref=e200]: / 22 млн ₽
                  - generic [ref=e201]:
                    - img [ref=e202]
                    - text: +8%
                - generic [ref=e205]:
                  - generic [ref=e206]:
                    - generic [ref=e207]: ДЗО (дебиторка)
                    - img [ref=e208]
                  - generic [ref=e211]: 34.2 млн ₽
                  - generic [ref=e212]:
                    - img [ref=e213]
                    - text: "-5%"
                - generic [ref=e216]:
                  - generic [ref=e217]:
                    - generic [ref=e218]: Средняя маржа
                    - img [ref=e219]
                  - generic [ref=e222]: 14.7%
                  - generic [ref=e223]:
                    - img [ref=e224]
                    - text: +1.2пп
              - generic [ref=e227]:
                - generic [ref=e228]:
                  - heading "Тендерная воронка" [level=3] [ref=e229]
                  - button "Все тендеры" [ref=e230] [cursor=pointer]:
                    - text: Все тендеры
                    - img [ref=e231]
                - generic [ref=e233]:
                  - generic [ref=e234]:
                    - generic [ref=e235]:
                      - generic [ref=e237]: "47"
                      - generic [ref=e238]: Поступило
                    - generic [ref=e239]:
                      - img [ref=e240]
                      - generic [ref=e242]: 26%
                  - generic [ref=e243]:
                    - generic [ref=e244]:
                      - generic [ref=e246]: "12"
                      - generic [ref=e247]: В работе
                    - generic [ref=e248]:
                      - img [ref=e249]
                      - generic [ref=e251]: 67%
                  - generic [ref=e252]:
                    - generic [ref=e253]:
                      - generic [ref=e255]: "8"
                      - generic [ref=e256]: Выиграно
                    - generic [ref=e257]:
                      - img [ref=e258]
                      - generic [ref=e260]: 38%
                  - generic [ref=e261]:
                    - generic [ref=e262]:
                      - generic [ref=e264]: "3"
                      - generic [ref=e265]: Проиграно
                    - generic [ref=e266]:
                      - img [ref=e267]
                      - generic [ref=e269]: 67%
                  - generic [ref=e271]:
                    - generic [ref=e273]: "2"
                    - generic [ref=e274]: Отменено
              - generic [ref=e275]:
                - generic [ref=e276]:
                  - generic [ref=e277]:
                    - generic [ref=e278]: Ср. срок согласования
                    - img [ref=e280]
                  - generic [ref=e283]:
                    - generic [ref=e284]:
                      - generic [ref=e285]: 2.3 дня
                      - generic [ref=e286]:
                        - img [ref=e287]
                        - text: "-0.5 дн"
                    - img [ref=e290]
                - generic [ref=e292]:
                  - generic [ref=e293]:
                    - generic [ref=e294]: "% победы в тендерах"
                    - img [ref=e296]
                  - generic [ref=e299]:
                    - generic [ref=e300]:
                      - generic [ref=e301]: 68%
                      - generic [ref=e302]:
                        - img [ref=e303]
                        - text: +4%
                    - img [ref=e306]
                - generic [ref=e308]:
                  - generic [ref=e309]:
                    - generic [ref=e310]: Просроченные документы
                    - img [ref=e312]
                  - generic [ref=e314]:
                    - generic [ref=e315]:
                      - generic [ref=e316]: "7"
                      - generic [ref=e317]:
                        - img [ref=e318]
                        - text: "-3"
                    - img [ref=e321]
                - generic [ref=e323]:
                  - generic [ref=e324]:
                    - generic [ref=e325]: Средняя загрузка
                    - img [ref=e327]
                  - generic [ref=e332]:
                    - generic [ref=e333]:
                      - generic [ref=e334]: 84%
                      - generic [ref=e335]:
                        - img [ref=e336]
                        - text: +2%
                    - img [ref=e339]
              - generic [ref=e341]:
                - generic [ref=e342]:
                  - heading "Структура портфеля по типам объектов" [level=3] [ref=e343]
                  - generic [ref=e344]: Выручка, млн ₽
                - generic [ref=e345]:
                  - generic [ref=e348]:
                    - list [ref=e350]:
                      - listitem [ref=e351]:
                        - img "Выручка (млн ₽) legend icon" [ref=e352]
                        - text: Выручка (млн ₽)
                      - listitem [ref=e354]:
                        - img "Доля (%) legend icon" [ref=e355]
                        - text: Доля (%)
                    - application [ref=e357]:
                      - generic [ref=e394]:
                        - generic [ref=e395]:
                          - generic [ref=e397]: Торговые центры
                          - generic [ref=e399]: Инфраструктура
                        - generic [ref=e400]:
                          - generic [ref=e402]: "0"
                          - generic [ref=e404]: "15"
                          - generic [ref=e406]: "30"
                          - generic [ref=e408]: "45"
                          - generic [ref=e410]: "60"
                  - generic [ref=e413]:
                    - list [ref=e415]:
                      - listitem [ref=e416]:
                        - img "Жилые комплексы legend icon" [ref=e417]
                        - text: Жилые комплексы
                      - listitem [ref=e419]:
                        - img "Инфраструктура legend icon" [ref=e420]
                        - text: Инфраструктура
                      - listitem [ref=e422]:
                        - img "Промышленность legend icon" [ref=e423]
                        - text: Промышленность
                      - listitem [ref=e425]:
                        - img "Торговые центры legend icon" [ref=e426]
                        - text: Торговые центры
                    - application [ref=e428]:
                      - generic [ref=e444]:
                        - generic [ref=e447]: "Жилые комплексы: 45%"
                        - generic [ref=e450]: "Торговые центры: 28%"
                        - generic [ref=e453]: "Промышленность: 18%"
                        - generic [ref=e456]: "Инфраструктура: 9%"
              - generic [ref=e457]:
                - generic [ref=e458]:
                  - generic [ref=e459]:
                    - heading "Динамика выручки (12 мес)" [level=3] [ref=e460]
                    - generic [ref=e461]: +18% YoY
                  - generic [ref=e464]:
                    - list [ref=e466]:
                      - listitem [ref=e467]:
                        - img "Выручка (млн ₽) legend icon" [ref=e468]
                        - text: Выручка (млн ₽)
                    - application [ref=e470]:
                      - generic [ref=e495]:
                        - generic [ref=e496]:
                          - generic [ref=e498]: Май
                          - generic [ref=e500]: Июл
                          - generic [ref=e502]: Авг
                          - generic [ref=e504]: Сен
                          - generic [ref=e506]: Окт
                          - generic [ref=e508]: Ноя
                          - generic [ref=e510]: Дек
                          - generic [ref=e512]: Янв
                          - generic [ref=e514]: Фев
                          - generic [ref=e516]: Апр
                        - generic [ref=e517]:
                          - generic [ref=e519]: "0"
                          - generic [ref=e521]: "20"
                          - generic [ref=e523]: "40"
                          - generic [ref=e525]: "60"
                          - generic [ref=e527]: "80"
                - generic [ref=e528]:
                  - generic [ref=e529]:
                    - heading "Топ-проекты по выручке" [level=3] [ref=e530]
                    - button "Все" [ref=e531] [cursor=pointer]:
                      - text: Все
                      - img [ref=e532]
                  - generic [ref=e534]:
                    - generic [ref=e535] [cursor=pointer]:
                      - generic [ref=e538]:
                        - generic [ref=e539]: ЖК «Северный»
                        - generic [ref=e540]: "Дедлайн: 10.05.2026"
                      - generic [ref=e541]:
                        - generic [ref=e542]: 45.2 млн ₽
                        - generic [ref=e543]: 78%
                    - generic [ref=e544] [cursor=pointer]:
                      - generic [ref=e547]:
                        - generic [ref=e548]: ТЦ «Меридиан»
                        - generic [ref=e549]: "Дедлайн: 25.05.2026"
                      - generic [ref=e550]:
                        - generic [ref=e551]: 28.7 млн ₽
                        - generic [ref=e552]: 45%
                    - generic [ref=e553] [cursor=pointer]:
                      - generic [ref=e556]:
                        - generic [ref=e557]: ТЭЦ-5
                        - generic [ref=e558]: "Дедлайн: 30.05.2026"
                      - generic [ref=e559]:
                        - generic [ref=e560]: 19.1 млн ₽
                        - generic [ref=e561]: 61%
              - generic [ref=e562]:
                - generic [ref=e563]:
                  - heading "Ближайшие дедлайны" [level=3] [ref=e564]
                  - button "Календарь" [ref=e565] [cursor=pointer]:
                    - text: Календарь
                    - img [ref=e566]
                - generic [ref=e568]:
                  - generic [ref=e570] [cursor=pointer]:
                    - generic [ref=e571]: Сегодня
                    - generic [ref=e572]: "20.05"
                    - generic [ref=e573]: КЖ-02-014
                  - generic [ref=e576] [cursor=pointer]:
                    - generic [ref=e577]: Завтра
                    - generic [ref=e578]: "21.05"
                    - generic [ref=e579]: АР-03-015
                  - generic [ref=e582] [cursor=pointer]:
                    - generic [ref=e583]: Пн
                    - generic [ref=e584]: "25.05"
                    - generic [ref=e585]: ТЦ «Меридиан»
                  - generic [ref=e588] [cursor=pointer]:
                    - generic [ref=e589]: Чт
                    - generic [ref=e590]: "28.05"
                    - generic [ref=e591]: ОВиК-02-008
                  - generic [ref=e594] [cursor=pointer]:
                    - generic [ref=e595]: Пн
                    - generic [ref=e596]: "02.06"
                    - generic [ref=e597]: ТЭЦ-5
            - generic [ref=e598]:
              - generic [ref=e599]:
                - generic [ref=e600]:
                  - heading "Риски и требования внимания" [level=3] [ref=e601]
                  - generic [ref=e602]:
                    - generic [ref=e603]: "3"
                    - img [ref=e604]
                - generic [ref=e606]:
                  - generic [ref=e609] [cursor=pointer]:
                    - generic [ref=e610]:
                      - generic [ref=e611]: ДЗО превышен на 8 млн ₽
                      - generic [ref=e612]: Финансовый отчёт →
                    - generic [ref=e613]: Высокий приоритет
                  - generic [ref=e616] [cursor=pointer]:
                    - generic [ref=e617]:
                      - generic [ref=e618]: Офис «Гамма» — просрочка 2 дня
                      - generic [ref=e619]: В Workflow →
                    - generic [ref=e620]: Высокий приоритет
                  - generic [ref=e623] [cursor=pointer]:
                    - generic [ref=e624]:
                      - generic [ref=e625]: Тендерный отдел — перегруз 85%
                      - generic [ref=e626]: Перераспределить →
                    - generic [ref=e627]: Средний приоритет
              - generic [ref=e628]:
                - generic [ref=e629]:
                  - img [ref=e633]
                  - generic [ref=e674]:
                    - heading "Рекомендации IRIS" [level=3] [ref=e675]
                    - text: AI-ассистент
                - generic [ref=e677]:
                  - img [ref=e678]
                  - generic [ref=e681]:
                    - paragraph [ref=e682]:
                      - text: "Перегруз тендерного отдела:"
                      - strong [ref=e683]: 85%
                      - text: . Переложить
                      - strong [ref=e684]: КЖ-02-014
                      - text: на проектный?
                    - generic [ref=e685]:
                      - button "Применить" [ref=e686] [cursor=pointer]
                      - button "Подробнее" [ref=e687] [cursor=pointer]
    - region "Notifications alt+T"
  - generic [ref=e688]: "20"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Layout + Navigation', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Входим через демо-режим
  6  |     await page.goto('/login');
  7  |     await page.getByRole('button', { name: /Демо-режим/ }).click();
  8  |     await page.waitForURL(/.*\/dashboard/);
  9  |   });
  10 | 
  11 |   test('5 табов навигации отображаются', async ({ page }) => {
  12 |     const nav = page.locator('nav[aria-label="Главная навигация"]');
  13 |     await expect(nav).toBeVisible();
  14 |     const tabs = nav.locator('a');
  15 |     const count = await tabs.count();
  16 |     expect(count).toBeGreaterThanOrEqual(5);
  17 |   });
  18 | 
  19 |   test('глобальный поиск работает', async ({ page }) => {
  20 |     const search = page.locator('input[placeholder*="Поиск"]');
  21 |     await expect(search).toBeVisible();
  22 |     await search.fill('тест');
  23 |     await expect(search).toHaveValue('тест');
  24 |   });
  25 | 
  26 |   test('переключение темы в Layout', async ({ page }) => {
  27 |     const html = page.locator('html');
  28 |     const before = await html.getAttribute('data-theme') || 'light';
  29 |     // Дождаться пока toast-уведомления исчезнут (sonner auto-dismiss)
  30 |     await page.waitForTimeout(2000);
  31 |     await page.evaluate(() => {
  32 |       document.querySelectorAll('[data-sonner-toast]').forEach(el => el.remove());
  33 |     });
  34 |     // Click theme button (the one with Sparkles/Moon/Sun icon, not user menu)
> 35 |     await page.locator('header button[title^="Тема:"]').click();
     |                                                         ^ Error: locator.click: Test timeout of 30000ms exceeded.
  36 |     await page.waitForTimeout(300);
  37 |     // Click on a theme different from current (e.g., if light → dark)
  38 |     const targetTheme = before === 'light' ? 'Тёмная' : 'Светлая';
  39 |     await page.getByRole('menuitem', { name: targetTheme }).click();
  40 |     const after = await html.getAttribute('data-theme');
  41 |     expect(after).not.toBe(before);
  42 |   });
  43 | 
  44 |   test('роутинг на /projects работает', async ({ page }) => {
  45 |     // Переходим напрямую на страницу проектов
  46 |     await page.goto('/projects');
  47 |     await page.waitForURL(/.*\/projects/);
  48 |     // Проверяем, что страница загрузилась (любой контент проектов)
  49 |     await expect(page.locator('body')).toContainText(/проект|заказ|тендер|документ/i);
  50 |   });
  51 | 
  52 |   test('404 страница для неизвестных роутов', async ({ page }) => {
  53 |     await page.goto('/nonexistent-page');
  54 |     await expect(page.getByText(/404|Не найдено|Страница не существует/i)).toBeVisible();
  55 |   });
  56 | });
  57 | 
```