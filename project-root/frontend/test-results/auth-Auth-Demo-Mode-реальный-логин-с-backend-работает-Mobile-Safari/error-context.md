# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Auth + Demo Mode >> реальный логин с backend работает
- Location: e2e\auth.spec.ts:33:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByText(/Администратор|admin/)
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Администратор|admin/)
    9 × locator resolved to <span class="hidden md:inline">Администратор</span>
      - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - banner [ref=e5]:
          - generic [ref=e6]:
            - link "ДокПоток IRIS ДокПоток IRIS" [ref=e7]:
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
            - link [ref=e50]:
              - /url: /dashboard
              - img [ref=e53]
            - link [ref=e56]:
              - /url: /tenders
              - img [ref=e59]
            - link [ref=e65]:
              - /url: /portfolio
              - img [ref=e68]
            - link [ref=e70]:
              - /url: /project-portfolio
              - img [ref=e73]
            - link [ref=e76]:
              - /url: /project-tasks
              - img [ref=e79]
            - link [ref=e82]:
              - /url: /package
              - img [ref=e85]
            - link [ref=e89]:
              - /url: /documents
              - img [ref=e92]
            - link [ref=e95]:
              - /url: /production
              - img [ref=e98]
            - link [ref=e100]:
              - /url: /workflow
              - img [ref=e103]
            - link [ref=e106]:
              - /url: /archive
              - img [ref=e109]
            - link [ref=e112]:
              - /url: /achievements
              - img [ref=e115]
            - link [ref=e121]:
              - /url: /calendar
              - img [ref=e124]
            - link [ref=e126]:
              - /url: /admin
              - img [ref=e129]
            - link [ref=e131]:
              - /url: /references
              - img [ref=e134]
            - link [ref=e136]:
              - /url: /reports
              - img [ref=e139]
          - generic [ref=e142]:
            - img
            - textbox "Глобальный поиск (Ctrl+K)" [ref=e143]:
              - /placeholder: Поиск (Ctrl+K)
      - main [ref=e144]:
        - generic [ref=e146]:
          - generic [ref=e147]:
            - generic [ref=e148]:
              - generic [ref=e149]:
                - heading "Панель управления" [level=1] [ref=e150]
                - paragraph [ref=e151]: Стратегическая сводка по финансам, тендерам и проектам
              - generic [ref=e153]:
                - button "Сегодня" [ref=e154] [cursor=pointer]
                - button "Неделя" [ref=e155] [cursor=pointer]
                - button "Месяц" [ref=e156] [cursor=pointer]
                - button "Квартал" [ref=e157] [cursor=pointer]
            - generic [ref=e158]:
              - generic [ref=e159] [cursor=pointer]:
                - generic [ref=e160]:
                  - img [ref=e161]
                  - generic [ref=e163]: Утвердить смету ТЭЦ-5
                  - generic [ref=e164]: Сегодня
                - button "Подписать" [ref=e165]
              - generic [ref=e166] [cursor=pointer]:
                - generic [ref=e167]:
                  - img [ref=e168]
                  - generic [ref=e170]: Согласовать КП «Меридиан»
                  - generic [ref=e171]: Завтра
                - button "Открыть" [ref=e172]
              - generic [ref=e173] [cursor=pointer]:
                - generic [ref=e174]:
                  - img [ref=e175]
                  - generic [ref=e177]: Подписать доп. №4 к договору
                  - generic [ref=e178]: "25.05"
                - button "Перейти" [ref=e179]
            - generic [ref=e180]:
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - generic [ref=e183]: Выручка (план)
                  - img [ref=e184]
                - generic [ref=e186]:
                  - text: "124.7"
                  - generic [ref=e187]: / 150 млн ₽
                - generic [ref=e188]:
                  - img [ref=e189]
                  - text: +12%
              - generic [ref=e192]:
                - generic [ref=e193]:
                  - generic [ref=e194]: Прибыль (план)
                  - img [ref=e195]
                - generic [ref=e198]:
                  - text: "18.3"
                  - generic [ref=e199]: / 22 млн ₽
                - generic [ref=e200]:
                  - img [ref=e201]
                  - text: +8%
              - generic [ref=e204]:
                - generic [ref=e205]:
                  - generic [ref=e206]: ДЗО (дебиторка)
                  - img [ref=e207]
                - generic [ref=e210]: 34.2 млн ₽
                - generic [ref=e211]:
                  - img [ref=e212]
                  - text: "-5%"
              - generic [ref=e215]:
                - generic [ref=e216]:
                  - generic [ref=e217]: Средняя маржа
                  - img [ref=e218]
                - generic [ref=e221]: 14.7%
                - generic [ref=e222]:
                  - img [ref=e223]
                  - text: +1.2пп
            - generic [ref=e226]:
              - generic [ref=e227]:
                - heading "Тендерная воронка" [level=3] [ref=e228]
                - button "Все тендеры" [ref=e229] [cursor=pointer]:
                  - text: Все тендеры
                  - img [ref=e230]
              - generic [ref=e232]:
                - generic [ref=e233]:
                  - generic [ref=e234]:
                    - generic [ref=e236]: "47"
                    - generic [ref=e237]: Поступило
                  - generic [ref=e238]:
                    - img [ref=e239]
                    - generic [ref=e241]: 26%
                - generic [ref=e242]:
                  - generic [ref=e243]:
                    - generic [ref=e245]: "12"
                    - generic [ref=e246]: В работе
                  - generic [ref=e247]:
                    - img [ref=e248]
                    - generic [ref=e250]: 67%
                - generic [ref=e251]:
                  - generic [ref=e252]:
                    - generic [ref=e254]: "8"
                    - generic [ref=e255]: Выиграно
                  - generic [ref=e256]:
                    - img [ref=e257]
                    - generic [ref=e259]: 38%
                - generic [ref=e260]:
                  - generic [ref=e261]:
                    - generic [ref=e263]: "3"
                    - generic [ref=e264]: Проиграно
                  - generic [ref=e265]:
                    - img [ref=e266]
                    - generic [ref=e268]: 67%
                - generic [ref=e270]:
                  - generic [ref=e272]: "2"
                  - generic [ref=e273]: Отменено
            - generic [ref=e274]:
              - generic [ref=e275]:
                - generic [ref=e276]:
                  - generic [ref=e277]: Ср. срок согласования
                  - img [ref=e279]
                - generic [ref=e282]:
                  - generic [ref=e283]:
                    - generic [ref=e284]: 2.3 дня
                    - generic [ref=e285]:
                      - img [ref=e286]
                      - text: "-0.5 дн"
                  - img [ref=e289]
              - generic [ref=e291]:
                - generic [ref=e292]:
                  - generic [ref=e293]: "% победы в тендерах"
                  - img [ref=e295]
                - generic [ref=e298]:
                  - generic [ref=e299]:
                    - generic [ref=e300]: 68%
                    - generic [ref=e301]:
                      - img [ref=e302]
                      - text: +4%
                  - img [ref=e305]
              - generic [ref=e307]:
                - generic [ref=e308]:
                  - generic [ref=e309]: Просроченные документы
                  - img [ref=e311]
                - generic [ref=e313]:
                  - generic [ref=e314]:
                    - generic [ref=e315]: "7"
                    - generic [ref=e316]:
                      - img [ref=e317]
                      - text: "-3"
                  - img [ref=e320]
              - generic [ref=e322]:
                - generic [ref=e323]:
                  - generic [ref=e324]: Средняя загрузка
                  - img [ref=e326]
                - generic [ref=e331]:
                  - generic [ref=e332]:
                    - generic [ref=e333]: 84%
                    - generic [ref=e334]:
                      - img [ref=e335]
                      - text: +2%
                  - img [ref=e338]
            - generic [ref=e340]:
              - generic [ref=e341]:
                - heading "Структура портфеля по типам объектов" [level=3] [ref=e342]
                - generic [ref=e343]: Выручка, млн ₽
              - generic [ref=e344]:
                - generic [ref=e347]:
                  - list [ref=e349]:
                    - listitem [ref=e350]:
                      - img "Выручка (млн ₽) legend icon" [ref=e351]
                      - text: Выручка (млн ₽)
                    - listitem [ref=e353]:
                      - img "Доля (%) legend icon" [ref=e354]
                      - text: Доля (%)
                  - application [ref=e356]:
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
                    - generic [ref=e445]:
                      - generic [ref=e448]: "Жилые комплексы: 45%"
                      - generic [ref=e451]: "Торговые центры: 28%"
                      - generic [ref=e454]: "Промышленность: 18%"
                      - generic [ref=e457]: "Инфраструктура: 9%"
            - generic [ref=e458]:
              - generic [ref=e459]:
                - generic [ref=e460]:
                  - heading "Динамика выручки (12 мес)" [level=3] [ref=e461]
                  - generic [ref=e462]: +18% YoY
                - generic [ref=e465]:
                  - list [ref=e467]:
                    - listitem [ref=e468]:
                      - img "Выручка (млн ₽) legend icon" [ref=e469]
                      - text: Выручка (млн ₽)
                  - application [ref=e471]:
                    - generic [ref=e497]:
                      - generic [ref=e498]:
                        - generic [ref=e500]: Май
                        - generic [ref=e502]: Июл
                        - generic [ref=e504]: Авг
                        - generic [ref=e506]: Сен
                        - generic [ref=e508]: Окт
                        - generic [ref=e510]: Ноя
                        - generic [ref=e512]: Дек
                        - generic [ref=e514]: Янв
                        - generic [ref=e516]: Фев
                        - generic [ref=e518]: Апр
                      - generic [ref=e519]:
                        - generic [ref=e521]: "0"
                        - generic [ref=e523]: "20"
                        - generic [ref=e525]: "40"
                        - generic [ref=e527]: "60"
                        - generic [ref=e529]: "80"
              - generic [ref=e530]:
                - generic [ref=e531]:
                  - heading "Топ-проекты по выручке" [level=3] [ref=e532]
                  - button "Все" [ref=e533] [cursor=pointer]:
                    - text: Все
                    - img [ref=e534]
                - generic [ref=e536]:
                  - generic [ref=e537] [cursor=pointer]:
                    - generic [ref=e540]:
                      - generic [ref=e541]: ЖК «Северный»
                      - generic [ref=e542]: "Дедлайн: 10.05.2026"
                    - generic [ref=e543]:
                      - generic [ref=e544]: 45.2 млн ₽
                      - generic [ref=e545]: 78%
                  - generic [ref=e546] [cursor=pointer]:
                    - generic [ref=e549]:
                      - generic [ref=e550]: ТЦ «Меридиан»
                      - generic [ref=e551]: "Дедлайн: 25.05.2026"
                    - generic [ref=e552]:
                      - generic [ref=e553]: 28.7 млн ₽
                      - generic [ref=e554]: 45%
                  - generic [ref=e555] [cursor=pointer]:
                    - generic [ref=e558]:
                      - generic [ref=e559]: ТЭЦ-5
                      - generic [ref=e560]: "Дедлайн: 30.05.2026"
                    - generic [ref=e561]:
                      - generic [ref=e562]: 19.1 млн ₽
                      - generic [ref=e563]: 61%
            - generic [ref=e564]:
              - generic [ref=e565]:
                - heading "Ближайшие дедлайны" [level=3] [ref=e566]
                - button "Календарь" [ref=e567] [cursor=pointer]:
                  - text: Календарь
                  - img [ref=e568]
              - generic [ref=e570]:
                - generic [ref=e572] [cursor=pointer]:
                  - generic [ref=e573]: Сегодня
                  - generic [ref=e574]: "20.05"
                  - generic [ref=e575]: КЖ-02-014
                - generic [ref=e578] [cursor=pointer]:
                  - generic [ref=e579]: Завтра
                  - generic [ref=e580]: "21.05"
                  - generic [ref=e581]: АР-03-015
                - generic [ref=e584] [cursor=pointer]:
                  - generic [ref=e585]: Пн
                  - generic [ref=e586]: "25.05"
                  - generic [ref=e587]: ТЦ «Меридиан»
                - generic [ref=e590] [cursor=pointer]:
                  - generic [ref=e591]: Чт
                  - generic [ref=e592]: "28.05"
                  - generic [ref=e593]: ОВиК-02-008
                - generic [ref=e596] [cursor=pointer]:
                  - generic [ref=e597]: Пн
                  - generic [ref=e598]: "02.06"
                  - generic [ref=e599]: ТЭЦ-5
          - generic [ref=e600]:
            - generic [ref=e601]:
              - generic [ref=e602]:
                - heading "Риски и требования внимания" [level=3] [ref=e603]
                - generic [ref=e604]:
                  - generic [ref=e605]: "3"
                  - img [ref=e606]
              - generic [ref=e608]:
                - generic [ref=e611] [cursor=pointer]:
                  - generic [ref=e612]:
                    - generic [ref=e613]: ДЗО превышен на 8 млн ₽
                    - generic [ref=e614]: Финансовый отчёт →
                  - generic [ref=e615]: Высокий приоритет
                - generic [ref=e618] [cursor=pointer]:
                  - generic [ref=e619]:
                    - generic [ref=e620]: Офис «Гамма» — просрочка 2 дня
                    - generic [ref=e621]: В Workflow →
                  - generic [ref=e622]: Высокий приоритет
                - generic [ref=e625] [cursor=pointer]:
                  - generic [ref=e626]:
                    - generic [ref=e627]: Тендерный отдел — перегруз 85%
                    - generic [ref=e628]: Перераспределить →
                  - generic [ref=e629]: Средний приоритет
            - generic [ref=e630]:
              - generic [ref=e631]:
                - img [ref=e635]
                - generic [ref=e676]:
                  - heading "Рекомендации IRIS" [level=3] [ref=e677]
                  - text: AI-ассистент
              - generic [ref=e679]:
                - img [ref=e680]
                - generic [ref=e683]:
                  - paragraph [ref=e684]:
                    - text: "Перегруз тендерного отдела:"
                    - strong [ref=e685]: 85%
                    - text: . Переложить
                    - strong [ref=e686]: КЖ-02-014
                    - text: на проектный?
                  - generic [ref=e687]:
                    - button "Применить" [ref=e688] [cursor=pointer]
                    - button "Подробнее" [ref=e689] [cursor=pointer]
    - region "Notifications alt+T":
      - list:
        - listitem [ref=e690]:
          - img [ref=e692]
          - generic [ref=e695]: Internal server error
        - listitem [ref=e696]:
          - img [ref=e698]
          - generic [ref=e701]: Internal server error
        - listitem [ref=e702]:
          - img [ref=e704]
          - generic [ref=e707]: Internal server error
        - listitem:
          - generic:
            - img
          - generic:
            - generic: Internal server error
        - listitem:
          - generic:
            - img
          - generic:
            - generic: Internal server error
        - listitem:
          - generic:
            - img
          - generic:
            - generic: Internal server error
  - generic [ref=e708]: "20"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Auth + Demo Mode', () => {
  4  |   test('страница логина отображается', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await expect(page.getByRole('heading', { name: /Авторизация/ })).toBeVisible();
  7  |     await expect(page.getByPlaceholder(/Введите логин/)).toBeVisible();
  8  |     await expect(page.getByPlaceholder(/Введите пароль/)).toBeVisible();
  9  |   });
  10 | 
  11 |   test('демо-режим входит без сервера', async ({ page }) => {
  12 |     await page.goto('/login');
  13 |     await page.getByRole('button', { name: /Демо-режим/ }).click();
  14 |     await expect(page).toHaveURL(/.*\/dashboard/);
  15 |     await expect(page.getByText(/Панель управления|Демо Пользователь/)).toBeVisible();
  16 |   });
  17 | 
  18 |   test('выход из демо-режима возвращает на /login', async ({ page }) => {
  19 |     await page.goto('/login');
  20 |     await page.getByRole('button', { name: /Демо-режим/ }).click();
  21 |     await page.waitForURL(/.*\/dashboard/);
  22 |     await page.waitForTimeout(500);
  23 |     // Закрыть toast-уведомления (sonner overlay)
  24 |     await page.evaluate(() => {
  25 |       document.querySelectorAll('[data-sonner-toast]').forEach(el => el.remove());
  26 |     });
  27 |     await page.locator('button[aria-haspopup="menu"]').last().click();
  28 |     await page.waitForTimeout(200);
  29 |     await page.getByRole('menuitem', { name: /Выйти/ }).first().click();
  30 |     await expect(page).toHaveURL(/.*\/login/);
  31 |   });
  32 | 
  33 |   test('реальный логин с backend работает', async ({ page }) => {
  34 |     await page.goto('/login');
  35 |     
  36 |     // Логируем network requests
  37 |     const requests: any[] = [];
  38 |     page.on('requestfinished', async (req) => {
  39 |       if (req.url().includes('/api/v1/auth/')) {
  40 |         const resp = await req.response();
  41 |         requests.push({
  42 |           url: req.url(),
  43 |           postData: req.postData(),
  44 |           status: resp?.status(),
  45 |           body: await resp?.text().catch(() => ''),
  46 |         });
  47 |       }
  48 |     });
  49 |     
  50 |     await page.getByPlaceholder(/Введите логин/).fill('admin');
  51 |     await page.getByPlaceholder(/Введите пароль/).fill('admin123');
  52 |     await page.getByRole('button', { name: /Войти/ }).click();
  53 |     
  54 |     await page.waitForTimeout(3000);
  55 |     
  56 |     console.log('Auth requests:', JSON.stringify(requests, null, 2));
  57 |     console.log('Current URL:', page.url());
  58 |     
  59 |     await expect(page).toHaveURL(/.*\/dashboard/);
> 60 |     await expect(page.getByText(/Администратор|admin/)).toBeVisible();
     |                                                         ^ Error: expect(locator).toBeVisible() failed
  61 |   });
  62 | 
  63 |   test('реальный логин с неверным паролем показывает ошибку', async ({ page }) => {
  64 |     await page.goto('/login');
  65 |     await page.getByPlaceholder(/Введите логин/).fill('admin');
  66 |     await page.getByPlaceholder(/Введите пароль/).fill('wrongpassword');
  67 |     await page.getByRole('button', { name: /Войти/ }).click();
  68 |     await page.waitForTimeout(1000);
  69 |     await expect(page.getByText(/Incorrect email\/username or password|Ошибка входа/)).toBeVisible();
  70 |   });
  71 | });
  72 | 
```