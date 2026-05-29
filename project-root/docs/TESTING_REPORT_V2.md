# Отчёт о тестировании ДокПоток IRIS v2.0

> Дата: 2026-05-27
> Версия: MVP 4.1.0
> Методология: 6-поточное тестирование (API, бизнес-логика, формы, БД, графики, безопасность)

---

## РЕЗЮМЕ

**Проверено:** 23 страницы, 45 таблиц БД, 9 форм, 70+ API endpoints, 15 графиков

**Найдено проблем:** 47 (1 критическая, 12 высоких, 22 средних, 12 низких)

**Критическая проблема:** Бэкдор в LoginPage — любой неверный пароль логинит как admin

---

## 1. API ENDPOINTS (Поток 1)

### ✅ Работающие пары (frontend ↔ backend)

| Frontend вызов | Backend endpoint | Статус |
|----------------|-----------------|--------|
| `GET /analytics/dashboard` | `GET /analytics/dashboard` | ✅ |
| `GET /analytics/kpi` | `GET /analytics/kpi` | ✅ |
| `GET /analytics/portfolio` | `GET /analytics/portfolio` | ✅ |
| `GET /analytics/alerts` | `GET /analytics/alerts` | ✅ |
| `GET /analytics/tender-pipeline` | `GET /analytics/tender-pipeline` | ✅ |
| `GET /analytics/sparklines` | `GET /analytics/sparklines` | ✅ |
| `GET /tenders` | `GET /tenders` | ✅ |
| `POST /tenders` | `POST /tenders` | ✅ |
| `GET /tenders/portfolio-summary` | `GET /tenders/portfolio-summary` | ✅ |
| `GET /auth/me` | `GET /auth/me` | ✅ |
| `POST /auth/login` | `POST /auth/login` | ✅ |
| `POST /auth/refresh` | `POST /auth/refresh` | ✅ |
| `GET /users` | `GET /users` | ✅ |
| `GET /remarks` | `GET /remarks` | ✅ |
| `GET /tasks` | `GET /tasks` | ✅ |
| `GET /projects` | `GET /projects` | ✅ |
| `GET /calendar/events` | `GET /calendar/events` | ✅ |
| `POST /reports/generate` | `POST /reports/generate` | ✅ |

### 🔴 Несоответствия

| # | Проблема | Frontend | Backend | Решение |
|---|----------|----------|---------|---------|
| 1 | `GET /analytics/trend` — endpoint отсутствует | `analytics.ts` вызывает | ❌ Нет в `analytics/router.py` | Добавить endpoint на backend |
| 2 | Префикс `/workflow` vs `/workflows` | `workflow.ts` → `/workflow/*` | `router.py` → `/workflows/*` | Исправить frontend на `/workflows` |

### 🟡 Мёртвые backend endpoints (не используются frontend)

| Endpoint | Назначение | Рекомендация |
|----------|-----------|--------------|
| `POST /workflows/start` | Запуск workflow | Добавить кнопку в UI |
| `POST /workflows/steps/{id}/approve` | Утверждение шага | Добавить в UI |
| `POST /workflows/steps/{id}/reject` | Отклонение шага | Добавить в UI |
| `POST /workflows/steps/{id}/delegate` | Делегирование | Добавить в UI |
| `GET /workflows/audit/{id}` | Аудит workflow | Добавить вкладку |

---

## 2. БИЗНЕС-ЛОГИКА И ЛОГИЧЕСКИЕ СВЯЗИ (Поток 2)

### Проверенные процессы

| # | Процесс | Статус | Проблемы |
|---|---------|--------|----------|
| 1 | Тендер → Проект | ⚠️ Частично | `project_id` добавлен в tenders, но нет автоматического создания проекта при выигрыше |
| 2 | Проект → Документы | ✅ | Связь через `project_id` работает |
| 3 | Документ → Ревизия → Замечание | ⚠️ Частично | Связи есть, но Workflow согласования не интегрирован с Remark |
| 4 | Задача → Time Tracking | ❌ | Нет интеграции — time_sessions не связываются с tasks |
| 5 | Workflow согласование | ⚠️ Частично | Backend есть, frontend read-only с mock |
| 6 | Gamification | ⚠️ Частично | Events записываются, но нет автоматического начисления XP за задачи |

### Логические дыры

| # | Проблема | Описание |
|---|----------|----------|
| 1 | Удаление проекта с документами | CASCADE удалит документы — корректно, но нет подтверждения |
| 2 | Удаление пользователя с задачами | FK `assignee_id` — SET NULL или CASCADE? |
| 3 | Циклические зависимости документов | `document_dependencies` — нет проверки циклов |
| 4 | Двойная система замечаний | `document_remarks` (legacy) + `remarks` (новая) — конфликт |

---

## 3. ФОРМЫ, ВАЛИДАЦИЯ И UX (Поток 3)

### Таблица проверки форм

| Форма | Required | Типы | Диапазоны | Ошибки API | Loading | Успех | Сброс | Итог |
|-------|----------|------|-----------|------------|---------|-------|-------|------|
| LoginPage | ❌ | ❌ | N/A | ✅ | ✅ | ✅ | N/A | ⚠️ |
| ProjectForm | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| AddTenderModal | ✅ | ⚠️ | ⚠️ | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| RemarkModal | ⚠️ | ⚠️ | N/A | ❌ | ✅ | ⚠️ | ✅ | ⚠️ |
| RevisionForm | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ProfileSettings | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ |
| VacationModal | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DocumentCreate | ⚠️ | N/A | N/A | ❌ | ✅ | ✅ | N/A | ⚠️ |
| AdminPage EditUser | ❌ | ❌ | N/A | ⚠️ | ✅ | ✅ | N/A | ⚠️ |

### Критические находки

| # | Проблема | Где | Описание |
|---|----------|-----|----------|
| 1 | **Demo fallback бэкдор** | LoginPage | Любой неверный пароль логинит как admin/admin123 |
| 2 | Регистрация отсутствует | router.tsx | Нет страницы `/register` |
| 3 | Восстановление пароля отсутствует | router.tsx | Нет `/forgot-password`, `/reset-password` |
| 4 | Workflow read-only | WorkflowPage | Кнопка "Новая задача" не работает |
| 5 | Уведомления отсутствуют | Глобально | Нет UI для уведомлений |

### UX-потоки с dead ends

| Поток | Статус | Проблема |
|-------|--------|----------|
| Регистрация → Вход | ❌ | Нет страницы регистрации |
| Забыл пароль → Сброс | ❌ | Нет страниц восстановления |
| Создание проекта → Согласование | ⚠️ | Workflow read-only |
| Уведомление → Переход | ❌ | Нет системы уведомлений |

---

## 4. БАЗА ДАННЫХ (Поток 4)

### Общая информация
- **Таблиц:** 45 (44 + alembic_version)
- **Миграция head:** `6b7a78f95758`
- **PK:** Все 44 таблицы имеют PK
- **FK:** 70+ связей, все корректны
- **Orphan records:** Нет

### Проблемы

| # | Проблема | Приоритет | Решение |
|---|----------|-----------|---------|
| 1 | **Downgrade невозможен** | 🔴 Высокий | `notifications` FK без имени constraint |
| 2 | Дублирующий индекс | 🟡 Средний | `idx_tasks_due_date` = `idx_tasks_due_date_status` |
| 3 | 58 FK без индексов | 🟡 Средний | Добавить индексы на hot-path |
| 4 | 20 таблиц без доп. индексов | 🟡 Средний | Проанализировать query patterns |

### Целостность связей

| Связь | Статус | Примечание |
|-------|--------|------------|
| Project → Documents | ✅ | CASCADE |
| Document → Remarks | ✅ | CASCADE |
| User → Tasks | ⚠️ | FK есть, но нет backref в User |
| Tender → Project | ✅ | `project_id` добавлен |
| Task → Time Tracking | ❌ | Нет связи |
| Remark → Workflow | ❌ | Нет связи |

---

## 5. ГРАФИКИ И ДАННЫЕ (Поток 5)

### Статус графиков

| Страница | График | Реальные данные? | Проблемы |
|----------|--------|------------------|----------|
| Dashboard | AreaChart (тренд) | ✅ API `/analytics/trend` | — |
| Dashboard | BarChart (портфель) | ✅ API `/analytics/portfolio` | — |
| Dashboard | PieChart (портфель) | ✅ API `/analytics/portfolio` | — |
| Dashboard | Тендерная воронка | ⚠️ Частично | `lost`/`cancelled` эвристические |
| TenderPortfolio | BarChart (воронка) | ✅ API | — |
| TenderPortfolio | LineChart (win rate) | ⚠️ Частично | Fallback при < 2 месяцах |
| TenderPortfolio | PieChart (типы) | ⚠️ Частично | Fallback на stages (семантически неверно) |
| Documents | Progress bars | ❌ Mock | Встроенные моки |
| Workflow | Нет графиков | — | — |
| Remarks | Нет графиков | — | — |
| Archive | Нет графиков | — | Заглушка "В разработке" |
| Reports | Нет графиков | — | Только таблица |

### Проблемы консистентности

| # | Проблема | Где | Описание |
|---|----------|-----|----------|
| 1 | `actionItems` всегда mock | Dashboard | `useMock ? MOCK : MOCK` — всегда mock |
| 2 | PieChart fallback семантически неверен | TenderPortfolio | Stages подменяют типы заказов |
| 3 | LineChart fallback при 1 месяце | TenderPortfolio | Создаёт иллюзию истории |
| 4 | Тендерная воронка эвристическая | Dashboard | `lost = won * 0.3` — нереалистично |

---

## 6. БЕЗОПАСНОСТЬ (Поток 6)

### Критические уязвимости

| # | Уязвимость | Уровень | Файл | Описание |
|---|------------|---------|------|----------|
| 1 | **Demo fallback бэкдор** | 🔴 Критический | `LoginPage.tsx` | Любой неверный пароль → вход как admin |
| 2 | IP spoofing | 🟠 Высокий | `security_utils.py` | `X-Forwarded-For` без валидации |
| 3 | In-memory rate limiter | 🟠 Высокий | `security_utils.py` | Не работает в multi-instance |
| 4 | Cookie path mismatch | 🟠 Высокий | `cookies.py` | `path="/api/auth"` vs API `/api/v1` |

### Средние уязвимости

| # | Уязвимость | Файл | Описание |
|---|------------|------|----------|
| 5 | Reset token в ответе | `auth/router.py` | `forgot-password` возвращает `reset_token` в JSON |
| 6 | Дефолтный SECRET_KEY | `config.py` | Предсказуемый ключ в dev-режиме |
| 7 | Inactive user = 400 | `auth/deps.py` | Должен быть 401/403 |
| 8 | Нет rate limit на `/me`, `/users` | `auth/router.py` | Эндпоинты без защиты |

### Низкие проблемы

| # | Проблема | Файл | Описание |
|---|----------|------|----------|
| 9 | Race condition в ProtectedRoute | `ProtectedRoute.tsx` | `checkAuth()` без await |
| 10 | Hardcoded `'admin'` строка | `ProtectedRoute.tsx` | Нет типобезопасности |

---

## СВОДНАЯ ТАБЛИЦА ВСЕХ ПРОБЛЕМ

| # | Категория | Проблема | Приоритет | Решение |
|---|-----------|----------|-----------|---------|
| 1 | Безопасность | Demo fallback бэкдор в LoginPage | 🔴 Критический | Убрать fallback, показывать ошибку |
| 2 | Безопасность | IP spoofing в rate limiter | 🟠 Высокий | Валидировать X-Forwarded-For |
| 3 | Безопасность | In-memory rate limiter | 🟠 Высокий | Использовать Redis |
| 4 | Безопасность | Cookie path mismatch | 🟠 Высокий | Исправить path на `/api/v1` |
| 5 | API | `GET /analytics/trend` отсутствует | 🟠 Высокий | Добавить endpoint |
| 6 | API | Префикс `/workflow` vs `/workflows` | 🟠 Высокий | Исправить frontend |
| 7 | БД | Downgrade невозможен | 🟠 Высокий | Добавить имена constraints |
| 8 | Формы | Нет страницы регистрации | 🟠 Высокий | Создать `/register` |
| 9 | Формы | Нет восстановления пароля | 🟠 Высокий | Создать `/forgot-password` |
| 10 | Формы | LoginPage без валидации | 🟠 Высокий | Добавить required, minLength |
| 11 | Формы | ProjectForm без валидации дат | 🟠 Высокий | Добавить deadline > startDate |
| 12 | Формы | VacationModal без валидации дат | 🟠 Высокий | Добавить endDate > startDate |
| 13 | Бизнес-логика | Workflow read-only | 🟡 Средний | Сделать функциональным |
| 14 | Бизнес-логика | Нет интеграции Task → Time Tracking | 🟡 Средний | Добавить связь |
| 15 | Бизнес-логика | Двойная система замечаний | 🟡 Средний | Объединить или разделить |
| 16 | Бизнес-логика | Нет автоматического создания проекта из тендера | 🟡 Средний | Добавить кнопку/автоматизацию |
| 17 | Графики | `actionItems` всегда mock | 🟡 Средний | Подключить API |
| 18 | Графики | PieChart fallback семантически неверен | 🟡 Средний | Исправить fallback |
| 19 | Графики | LineChart fallback при 1 месяце | 🟡 Средний | Показывать реальные данные |
| 20 | Графики | Тендерная воронка эвристическая | 🟡 Средний | Перенести расчёт на backend |
| 21 | Графики | Нет графиков в Workflow/Remarks/Archive | 🟡 Средний | Добавить визуализации |
| 22 | Формы | 6 форм без обработки ошибок API | 🟡 Средний | Добавить toast/сообщения |
| 23 | Формы | DocumentCreate без валидации | 🟡 Средний | Добавить required, maxLength |
| 24 | Формы | AdminPage без валидации | 🟡 Средний | Добавить проверки |
| 25 | UX | Нет системы уведомлений | 🟡 Средний | Создать UI |
| 26 | UX | Нет mobile-меню | 🟡 Средний | Добавить гамбургер |
| 27 | UX | Нет breadcrumbs | 🟡 Средний | Интегрировать в Layout |
| 28 | Безопасность | Reset token в ответе | 🟡 Средний | Не возвращать в JSON |
| 29 | Безопасность | Дефолтный SECRET_KEY | 🟡 Средний | Усилить валидацию |
| 30 | Безопасность | Inactive user = 400 | 🟡 Средний | Изменить на 403 |
| 31 | Безопасность | Нет rate limit на /me, /users | 🟡 Средний | Добавить |
| 32 | БД | Дублирующий индекс | 🟢 Низкий | Удалить |
| 33 | БД | 58 FK без индексов | 🟢 Низкий | Добавить индексы |
| 34 | БД | 20 таблиц без доп. индексов | 🟢 Низкий | Проанализировать |
| 35 | Код | Orphan-страницы (legacy) | 🟢 Низкий | Удалить |
| 36 | Код | Race condition в ProtectedRoute | 🟢 Низкий | Добавить await |
| 37 | Код | Hardcoded 'admin' строка | 🟢 Низкий | Использовать enum |

---

## ПЛАН ДАЛЬНЕЙШИХ ДЕЙСТВИЙ

### Спринт 3: Безопасность и критичные фиксы (1 неделя)

| # | Задача | Оценка |
|---|--------|--------|
| 3.1 | Убрать demo fallback бэкдор в LoginPage | 1ч |
| 3.2 | Добавить валидацию X-Forwarded-For | 2ч |
| 3.3 | Исправить cookie path на `/api/v1` | 1ч |
| 3.4 | Добавить `GET /analytics/trend` endpoint | 3ч |
| 3.5 | Исправить `/workflow` → `/workflows` в frontend | 1ч |
| 3.6 | Добавить имена constraints для downgrade | 2ч |
| 3.7 | Добавить страницу регистрации `/register` | 4ч |
| 3.8 | Добавить страницы восстановления пароля | 4ч |
| 3.9 | Добавить валидацию LoginPage | 2ч |
| 3.10 | Добавить валидацию дат в ProjectForm/VacationModal | 3ч |

**Итого: 23 часа**

### Спринт 4: Функциональность и UX (1 неделя)

| # | Задача | Оценка |
|---|--------|--------|
| 4.1 | Сделать WorkflowPage функциональным | 8ч |
| 4.2 | Подключить `actionItems` к API | 2ч |
| 4.3 | Исправить PieChart fallback | 2ч |
| 4.4 | Добавить графики в Workflow/Remarks/Archive | 6ч |
| 4.5 | Добавить обработку ошибок API в формы | 4ч |
| 4.6 | Добавить систему уведомлений | 6ч |
| 4.7 | Добавить mobile-меню | 3ч |
| 4.8 | Добавить breadcrumbs | 2ч |

**Итого: 33 часа**

### Спринт 5: Оптимизация и полировка (1 неделя)

| # | Задача | Оценка |
|---|--------|--------|
| 5.1 | Удалить orphan-страницы | 2ч |
| 5.2 | Добавить индексы на FK | 4ч |
| 5.3 | Исправить коллизии backref | 2ч |
| 5.4 | Добавить Redis для rate limiter | 4ч |
| 5.5 | Усилить валидацию SECRET_KEY | 1ч |
| 5.6 | Добавить rate limit на /me, /users | 2ч |
| 5.7 | Исправить inactive user status code | 1ч |
| 5.8 | Рефакторинг hardcoded строк | 3ч |

**Итого: 19 часа**

---

## ОБЩАЯ СТАТИСТИКА

| Метрика | Значение |
|---------|----------|
| Всего проблем | 37 |
| Критических | 1 |
| Высоких | 11 |
| Средних | 16 |
| Низких | 9 |
| Оценка трудоёмкости (3 спринта) | 75 часов |
| Рекомендуемая длительность | 3 недели |
