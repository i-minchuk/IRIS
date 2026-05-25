# Модуль: Frontend Pages

## Назначение
Страницы-роуты приложения.

## Структура
```
frontend/src/pages/
  LandingPage.tsx        # Лендинг с ChromeBot
  LoginPage.tsx          # Авторизация (demo mode)
  Dashboard.tsx          # Аналитика, KPI, IRIS widget
  ProjectsPage.tsx       # Портфель заказов (тендеры, шаблоны, проекты)
  DocumentsPage.tsx      # Документы + таблица сотрудников
  WorkflowPage/index.tsx # Документооборот: задачи и замечания
  RemarksPage/index.tsx  # Управление замечаниями (таблица, Kanban, статистика)
  ArchivePage/index.tsx  # Архив: timeline, поиск, материалы
  AdminPage.tsx          # Админ-панель
  PackagePage/           # Пакетная обработка
  PortfolioPage/         # Портфель
  ProductionControl/     # Производственный контроль
  ProjectPortfolioPage/  # Портфель проектов
  ProjectTasksPage/      # Задачи проекта
```

## Dashboard
- Финансовые KPI (выручка, прибыль, дебиторка, маржа)
- Тендерная воронка, sparklines
- Топ проектов, календарь дедлайнов, панель рисков
- IRIS AI widget (`ChromeBot`)

## ProjectsPage
- 4 вкладки: Тендеры, Типовые решения, Шаблоны, Проекты
- Mock-данные, фильтры, KPI-карточки
- Загрузка отделов, IRIS рекомендации

## DocumentsPage
- Таблица документов с фильтрами (проект, тип, статус)
- Вкладка "Сотрудники": геймификация (streaks, бейджи)

## WorkflowPage
- Загружает реальные данные (`getTasks`, `getRemarks`), fallback на mock
- Pipeline: Upload → Review → Approval → Archive
- Подвкладки: Задачи, Замечания

## RemarksPage
- Режимы: Таблица, Kanban, Статистика
- Zustand store `useRemarksStore`
- Фильтры, массовый выбор, модал создания

## ArchivePage
- Сайдбар: Timeline, Поиск, Материалы, Конструкции, Статистика
- Трёхколоночный layout

## Правила параллельной разработки
- Страницы — **толстые компоненты**, можно разбивать на подкомпоненты
- Mock-данные — хранить в константах внутри страницы
- **НЕ импортировать** страницы напрямую вне `router.tsx` (кроме Layout)
