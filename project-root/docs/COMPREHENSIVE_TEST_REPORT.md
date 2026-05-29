# Комплексный отчёт по тестированию ДокПоток IRIS

> Дата: 2026-05-27
> Версия: MVP 4.1.0
> Методология: Анализ кода, архитектуры, API, БД, UI/UX

---

## 1. СТРУКТУРА ПРОГРАММЫ

### Все страницы (23 штуки)

| # | Страница | Маршрут | В router | В навигации | API/Mock | Статус |
|---|----------|---------|----------|-------------|----------|--------|
| 1 | LandingPage | `/` | ✅ | ❌ публичная | Статика | 🟢 |
| 2 | LoginPage | `/login` | ✅ | ❌ публичная | `authApi.login` | 🟢 |
| 3 | Dashboard | `/dashboard` | ✅ | ✅ | API + MOCK fallback | 🟢 |
| 4 | ProjectsPage | `/projects` | ✅ | ✅ | Реальный API | 🟢 |
| 5 | DocumentsPage | `/documents` | ✅ | ✅ | API + моки | 🟡 |
| 6 | WorkflowPage | `/workflow` | ✅ | ✅ | API + MOCK fallback | 🟢 |
| 7 | RemarksPage | `/remarks` | ✅ | ✅ | Реальный API | 🟢 |
| 8 | ArchivePage | `/archive` | ✅ | ✅ | Реальный API | 🟢 |
| 9 | Achievements | `/achievements` | ✅ | ✅ | Реальный API | 🟢 |
| 10 | PackagePage | `/package` | ✅ | ✅ | Реальный API | 🟢 |
| 11 | TenderPortfolioPage | `/portfolio` | ✅ | ✅ | API + MOCK fallback | 🟢 |
| 12 | ProductionControl | `/production` | ✅ | ✅ | Реальный API | 🟢 |
| 13 | ProjectPortfolioPage | `/project-portfolio` | ✅ | ✅ | Реальный API | 🟢 |
| 14 | ProjectTasksPage | `/project-tasks` | ✅ | ✅ | Реальный API | 🟢 |
| 15 | TendersPage | `/tenders` | ✅ | ✅ | Реальный API | 🟢 |
| 16 | CalendarPage | `/calendar` | ✅ | ✅ | API + MOCK fallback | 🟢 |
| 17 | ReportsPage | `/reports` | ✅ | ✅ | **Только MOCK** | 🔴 |
| 18 | ProfileSettingsPage | `/profile` | ✅ | ❌ меню пользователя | `apiClient.put` | 🟢 |
| 19 | ReferencePage | `/references` | ✅ | ✅ | **Только статика** | 🔴 |
| 20 | DocumentCreate | `/documents/new` | ✅ | ❌ вложенный | Реальный API | 🟢 |
| 21 | ImportExcel | `/documents/import` | ✅ | ❌ вложенный | Клиентский парсинг | 🟡 |
| 22 | NotFound | `*` | ✅ | ❌ catch-all | — | 🟢 |
| 23 | AdminPage | `/admin` | ✅ | ✅ | Реальный API | 🟢 |

### Orphan-страницы (мусор)

| Страница | Файл | Проблема |
|----------|------|----------|
| ArchivePage (legacy) | `ArchivePage.tsx` | Старый архив, в router подключён `ArchivePage/index.tsx` |
| WorkflowPage (legacy) | `WorkflowPage.legacy.tsx` | Старый workflow, не используется |
| PortfolioPage | `PortfolioPage/index.tsx` | **Нет в router вообще** |
| TeamLoadSection | `TeamLoadSection.tsx` | Компонент в папке pages, не страница |
| DashboardWidgets | `DashboardWidgets.tsx` | Компонент в папке pages, не страница |

### Дублирование имён (конфликт импорта)

| Конфликт | Описание |
|----------|----------|
| `ArchivePage.tsx` vs `ArchivePage/index.tsx` | При импорте `@/pages/ArchivePage` resolve непредсказуем |
| `RemarksPage.tsx` vs `RemarksPage/index.tsx` | Re-export, не критично |

---

## 2. ФУНКЦИОНАЛЬНОСТЬ ПО ВКЛАДКАМ

### 2.1 Dashboard (Панель аналитики)

**Текущая функциональность:**
- Финансовые метрики (выручка, прибыль, ДЗО, маржа) с count-up анимацией
- Тендерная воронка (CSS funnel)
- KPI sparklines (4 шт, кастомный SVG)
- Структура портфеля: BarChart + PieChart (Recharts)
- Динамика выручки: AreaChart (Recharts)
- Топ-проекты, дедлайны, риски, AI-рекомендации

**Найденные проблемы:**
- ❌ AreaChart и Portfolio графики всегда используют MOCK-данные, не зависят от API
- ❌ Фильтр периода (сегодня/неделя/месяц/квартал) — только UI, не влияет на данные
- ❌ Нет zoom на графиках

**Недостающие элементы:**
- Фильтрация графиков по периоду
- Реальные данные для AreaChart и Portfolio
- Сравнение периодов (YoY, MoM)

### 2.2 Портфель заказов (`/portfolio`)

**Текущая функциональность:**
- KPI-шапка, воронка тендеров, аукционы, реестр, задачи
- BarChart + LineChart + PieChart (Recharts)

**Найденные проблемы:**
- ⚠️ LineChart и PieChart fallback на mock при отсутствии tenders
- ⚠️ Нет трендов по выручке

**Недостающие элементы:**
- Сравнительный анализ периодов
- График динамики объёма заказов

### 2.3 Тендеры (`/tenders`)

**Текущая функциональность:**
- KPI-карточки, поиск, фильтрация, таблица
- Модальное окно добавления с валидацией

**Найденные проблемы:**
- ❌ Нет графиков Recharts (хотя библиотека установлена)

### 2.4 Документация (`/documents`)

**Текущая функциональность:**
- Реестр документов (mock-данные)
- Сотрудники с загрузкой (API + mock fallback)
- Замечания с делегированием
- Геймификация (API)

**Найденные проблемы:**
- 🔴 Реестр документов — полностью на mock (`docsData`)
- 🔴 Карточки сотрудников — встроенные моки (`employeeWorkloads`)
- ❌ Нет графиков по типам документов, статусам, трендов

### 2.5 Документооборот (`/workflow`)

**Текущая функциональность:**
- Список задач и замечаний
- Фильтрация по статусам
- API + mock fallback

**Найденные проблемы:**
- ❌ Нет графиков (воронка, тренды, распределение)
- ❌ Нет Kanban-доски

### 2.6 Замечания (`/remarks`)

**Текущая функциональность:**
- 3 режима: Таблица, Kanban, Статистика
- Фильтры, экспорт, создание
- Реальный API

**Найденные проблемы:**
- ❌ Нет графиков по времени (тренды)
- ❌ Нет графика распределения по авторам
- ❌ Нет графика времени решения

### 2.7 Архив (`/archive`)

**Текущая функциональность:**
- Таймлайн, поиск, материалы, конструкции
- Сводка в сайдбаре

**Найденные проблемы:**
- 🔴 Статистика — заглушка "В разработке"
- ❌ Нет графиков по типам событий, активности

### 2.8 Отчёты (`/reports`)

**Текущая функциональность:**
- Выбор шаблона (4 типа)
- Фильтры по периоду
- Таблица mock-данных
- Экспорт CSV, печать

**Найденные проблемы:**
- 🔴 **Нет API-интеграции вообще**
- 🔴 **Нет графиков** (страница отчётов без графиков!)
- ❌ Фильтры по датам не влияют на визуализацию

### 2.9 Календарь (`/calendar`)

**Текущая функциональность:**
- Месячный и недельный вид
- События из проектов/задач/тендеров
- Цветовая кодировка, модальное окно деталей

**Найденные проблемы:**
- ❌ Нет графика загрузки по дням
- ❌ Нет heatmap активности

### 2.10 Производственный контроль (`/production`)

**Текущая функциональность:**
- Pipeline, загрузка участков, технологические карты
- API (getProjects, resourcesApi.getHeatmap)

**Найденные проблемы:**
- ❌ WorkloadHeatmap — не классический heatmap, а карточки
- ❌ GanttChart и DependencyGraph существуют, но не используются

---

## 3. НЕДОСТАЮЩИЕ ЛОГИЧЕСКИЕ СВЯЗИ

| # | Связь | Откуда | Куда | Что должно передаваться | Статус |
|---|-------|--------|------|------------------------|--------|
| 1 | Тендер → Проект | Тендеры | Проекты | При выигрыше тендера автоматически создавать проект | ❌ Нет FK `project_id` в `tenders` |
| 2 | Документ → Замечание | Документы | Замечания | При создании замечания привязывать к документу и ревизии | ⚠️ Частично (есть `document_id` в remarks) |
| 3 | Задача → Time Tracking | Задачи | Time Tracking | При старте задачи автоматически начинать учёт времени | ❌ Нет интеграции |
| 4 | Проект → Архив | Проекты | Архив | При завершении проекта автоматически архивировать | ❌ Нет |
| 5 | Remark → Workflow | Замечания | Workflow | При изменении статуса запускать workflow согласования | ❌ Нет |
| 6 | Dashboard → Детализация | Dashboard | Все страницы | Клик на метрику → переход с фильтрами | ⚠️ Есть навигация, но без параметров |
| 7 | Calendar → Сущности | Календарь | Проекты/Задачи/Тендеры | Клик на событие → переход к сущности | ✅ Есть модальное окно |
| 8 | Reports → Данные | Отчёты | API | Фильтры должны влиять на данные | ❌ Нет API |

---

## 4. ГРАФИКИ И ВИЗУАЛИЗАЦИИ

### Использование Recharts

| Страница | Компоненты Recharts | Данные |
|----------|---------------------|--------|
| Dashboard | AreaChart, BarChart, PieChart | Частично mock |
| TenderPortfolio | BarChart, LineChart, PieChart | API + fallback |
| Остальные | ❌ Не используется | — |

### Кастомные SVG-графики (не используются в роутинге!)

| Компонент | Файл | Тип | Где используется |
|-----------|------|-----|-----------------|
| GanttChart | `features/documents/components/GanttChart.tsx` | Диаграмма Ганта | ❌ Нигде |
| DependencyGraph | `features/documents/components/DependencyGraph.tsx` | Граф зависимостей | ❌ Нигде |
| ProjectPortfolio (bubble) | `features/analytics/components/ProjectPortfolio.tsx` | Bubble chart | ❌ Нигде |

### Недостающие графики по страницам

| Страница | Не хватает |
|----------|-----------|
| Dashboard | Реальных данных для AreaChart/BarChart/PieChart |
| Тендеры | Всех графиков |
| Документация | Графиков по типам, статусам, трендам |
| Workflow | Воронки, трендов, Kanban |
| Замечания | Трендов по времени, распределения по авторам |
| Архив | Статистики, графиков активности |
| Отчёты | **Всех графиков** |
| Производство | GanttChart, DependencyGraph, классического heatmap |
| Задачи | Графиков распределения, трендов просрочек |
| Достижения | Графика роста уровня, активности |

---

## 5. ФОРМЫ И ВАЛИДАЦИЯ

### Frontend формы

| Форма | Поля | Валидация | Ошибки API | Проблемы |
|-------|------|-----------|------------|----------|
| LoginPage | login, password | ❌ Нет required | ✅ Показывает | Нет клиентской валидации, demo-fallback скрывает ошибки |
| ProjectForm | 12+ полей | ⚠️ Частично required | ❌ Только console.error | Нет проверки budget > 0, deadline > startDate |
| RemarkModal | 8 полей | ✅ required на title, description | ⚠️ Не закрывается | Project_id захардкожен |
| RevisionForm | 6 полей + файл | ✅ required, min | ✅ Показывает | Нет валидации размера файла |
| VacationModal | 4 поля | ✅ required | ❌ Нет | Нет проверки endDate > startDate |
| AddTenderModal | 12+ полей | ✅ isValid мемо | ⚠️ Toast через axios | Нет проверки дат, nmc > 0 |
| ProfileSettings | 6 полей | ✅ **Лучшая в проекте** | ✅ Показывает | — |
| DocumentCreate (inline) | 4 поля | ❌ Нет | ❌ Нет | Все поля без required |

### Backend Pydantic валидация

| Модуль | Хорошая валидация | Слабая валидация |
|--------|-------------------|------------------|
| remarks | ✅ min/max length, pattern, gt | — |
| tasks | ✅ min/max, ge/le | — |
| workflow | ✅ min length, pattern `^[a-z_]+$` | — |
| auth | ⚠️ email через `@field_validator` | ❌ `password` без `min_length` |
| documents | — | ❌ `title` без `min_length`, все Optional |
| gamification | — | ❌ `event_type` просто `str` |

### Загрузка файлов

| Компонент | Типы файлов | Валидация размера | Проблемы |
|-----------|-------------|-------------------|----------|
| RevisionForm | `.pdf,.dwg,.docx,.xlsx` | ❌ Нет (только текст) | Нет реальной проверки |
| FileUploader (Portfolio) | 7 типов | ✅ Да | — |
| ImportExcel | `.xlsx,.xls,.csv` | ❌ Нет | Только клиентский парсинг |
| EditorArea | Любые | ❌ Нет | Принимает всё |

---

## 6. ТАБЛИЦЫ И БАЗА ДАННЫХ

### Всего таблиц: 44

### Критические проблемы

| # | Проблема | Описание |
|---|----------|----------|
| 1 | **Модель Document ≠ Миграция** | Миграция 28+ полей, модель 9 полей. Поля `name` vs `title`, `doc_type` vs `document_type` |
| 2 | **Нет FK `project_id` в `tenders`** | Нет связи тендер → проект |
| 3 | **Нет FK `user_id` в геймификации** | `engineer_metrics`, `gamification_events`, `badges`, `daily_quests`, `combo_achievements`, `notifications` — все без FK |
| 4 | **Дублирующие индексы в `tasks`** | `idx_tasks_due_date` и `idx_tasks_due_date_status` — идентичные |
| 5 | **Коллизии backref** | `remarks` используется 4 раза, `archive_entries` — 2 раза, `entry` — 3 раза |
| 6 | **Односторонние relationship** | Нет обратной навигации для Project.manager, Task.creator/assignee |
| 7 | **`remarks.created_at` = VARCHAR(35)** | Вместо DateTime — ломает datetime-функции |
| 8 | **Мягкие ссылки в gamification** | `project_id`, `ref_doc_id`, `ref_task_id` без FK |

### Дублирование данных

| Место | Описание |
|-------|----------|
| `Document.title` vs миграция `name` | Семантический дубликат |
| `document_remarks` vs `remarks` | Две системы замечаний |
| `Task.status` + `percent_complete` | Прогресс дублируется |
| `Revision.status` + `ApprovalWorkflow.status` | Статус согласования в двух местах |

---

## 7. НЕДОСТАЮЩИЕ ВКЛАДКИ

| # | Вкладка | Назначение | Приоритет |
|---|---------|------------|-----------|
| 1 | **Уведомления (центр)** | Централизованный просмотр всех уведомлений, не только badge в шапке | Средний |
| 2 | **Поиск (глобальный)** | Результаты поиска по всем сущностям на отдельной странице | Средний |
| 3 | **Импорт/Экспорт (центр)** | Управление всеми импортами и экспортами | Низкий |

---

## 8. ИНТЕГРАЦИИ И API

### Frontend → Backend соответствие

| Frontend вызывает | Backend endpoint | Статус |
|-------------------|-----------------|--------|
| `GET /api/v1/analytics/dashboard` | ✅ Есть | 🟢 |
| `GET /api/v1/analytics/alerts` | ✅ Есть | 🟢 |
| `GET /api/v1/analytics/tender-pipeline` | ✅ Есть | 🟢 |
| `GET /api/v1/analytics/sparklines` | ✅ Есть | 🟢 |
| `GET /api/v1/calendar/events` | ❌ **Нет** — backend не имеет этого endpoint | 🔴 |
| `GET /api/v1/reports/*` | ❌ **Нет** — ReportsPage только mock | 🔴 |
| `GET /api/v1/references/*` | ❌ **Нет** — ReferencePage только статика | 🔴 |

### API без frontend

| Endpoint | Назначение | Где должен использоваться |
|----------|-----------|---------------------------|
| `GET /api/v1/analytics/trend` | Тренды для AreaChart | Dashboard |
| `GET /api/v1/analytics/portfolio` | Данные портфеля | Dashboard |
| `POST /api/v1/ai/upload` | Загрузка файлов для AI | DocumentEditor |
| WebSocket `/ws` | Коллаборация | DocumentWorkspace |

---

## СВОДНАЯ ТАБЛИЦА НЕДОСТАТКОВ

| Категория | Описание проблемы | Приоритет | Предложенное решение |
|-----------|-------------------|-----------|----------------------|
| База данных | Модель Document ≠ миграция (28 vs 9 полей) | **ВЫСОКИЙ** | Синхронизировать модель и миграцию |
| База данных | Нет FK `project_id` в `tenders` | **ВЫСОКИЙ** | Добавить поле и FK |
| База данных | Нет FK в геймификационных таблицах | **ВЫСОКИЙ** | Добавить FK на `users.id` |
| API | ReportsPage — нет API-интеграции | **ВЫСОКИЙ** | Создать `/api/v1/reports/*` endpoints |
| API | CalendarPage — нет backend endpoint | **ВЫСОКИЙ** | Создать `/api/v1/calendar/events` |
| Графики | Dashboard AreaChart/Portfolio всегда mock | **ВЫСОКИЙ** | Подключить `/analytics/trend` и `/analytics/portfolio` |
| Графики | ReportsPage — нет графиков вообще | **ВЫСОКИЙ** | Добавить BarChart, PieChart, LineChart |
| Формы | LoginPage — нет клиентской валидации | Высокий | Добавить required, minLength |
| Формы | `password` без `min_length` в backend | Высокий | Добавить `min_length=8` |
| Формы | Нет проверки endDate > startDate | Средний | Добавить валидацию дат |
| UX | Mobile-меню отсутствует | Средний | Добавить гамбургер-меню |
| UX | Breadcrumbs не интегрированы | Средний | Добавить в Layout |
| UX | Нет глобальных hotkeys | Средний | Добавить Ctrl+K, Ctrl+S |
| UX | GanttChart/DependencyGraph не используются | Средний | Подключить к ProductionControl/Documents |
| UX | Archive статистика — заглушка | Средний | Реализовать статистику |
| Код | Orphan-страницы (legacy файлы) | Низкий | Удалить или заархивировать |
| Код | Дублирующие индексы в tasks | Низкий | Удалить один индекс |
| Код | Коллизии backref имён | Низкий | Дать уникальные имена |
| Код | `remarks.created_at` = VARCHAR | Низкий | Изменить на DateTime |

---

## РЕКОМЕНДАЦИИ ПО ПРИОРИТЕТАМ

### 🔴 Критично (нужно сделать немедленно)
1. Синхронизировать модель `Document` с миграцией
2. Добавить FK `project_id` в `tenders`
3. Добавить FK в геймификационные таблицы
4. Создать backend API для Calendar (`/calendar/events`)
5. Создать backend API для Reports (`/reports/*`)
6. Подключить реальные данные к Dashboard графикам

### 🟡 Важно (в ближайшую неделю)
7. Добавить графики на ReportsPage
8. Добавить валидацию форм (LoginPage, ProjectForm, VacationModal)
9. Добавить `min_length` для пароля в backend
10. Добавить mobile-меню
11. Интегрировать Breadcrumbs
12. Подключить GanttChart и DependencyGraph

### 🟢 Желательно (в следующий спринт)
13. Добавить глобальные hotkeys
14. Реализовать статистику в Archive
15. Удалить orphan-страницы
16. Исправить коллизии backref
17. Привести `remarks.created_at` к DateTime
