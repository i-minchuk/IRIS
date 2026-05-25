# Модуль: Frontend Features

## Назначение
Фичи по доменам (Feature-Sliced Design).

## Структура
```
frontend/src/features/
  auth/           # Авторизация
  ai/             # Inline AI-подсказки
  analytics/      # Аналитика
  profile/        # Профиль + i18n
  documents/      # Редактор документов, графы зависимостей
  projects/       # Дерево проектов
  remarks/        # Фильтры замечаний
  resources/      # Теплокарта, карточки сотрудников
  tenders/        # Реестр тендеров, воронка, аналитика
  variables/      # Панель переменных
  workflow/       # API workflow
  zoom/           # Глобальный zoom
  collaboration/  # Real-time collaboration
```

## Auth
- `LoginForm`, `ForgotPasswordPage`, `ResetPasswordPage`
- `authStore.ts` — Zustand: user, token, `isAuthenticated`, `login/logout/checkAuth`
- `authApi.ts`, `adminApi.ts`

## AI
- `aiApi.ts`, `useInlineAI.ts`
- `AIGhostText.tsx`, `InlineSuggestionWidget.tsx`
- WebSocket-ready для ghost text

## Profile
- `ProfilePage` с подкомпонентами (карточка, подпись, календарь, отпуск, менторство)
- `LanguageContext.tsx` + `translations.ts` — i18n (ru/en)

## Documents
- `DocumentEditor`, `DocumentDetailPanels`
- `DependencyGraphPage`, `GanttChart`

## Tenders
- `TenderRegistry`, `TenderPipeline`, `TenderAnalytics`
- `TenderAuctionPanel`, `TenderKPIHeader`, `TenderTaskPanel`

## Zoom
- `FloatingZoom.tsx`
- `zoomStore.ts` — persisted в localStorage, диапазон 0.75–1.5

## Collaboration
- `CollaborationProvider.tsx`, `collaborationStore.ts`
- `lock.ts` — API блокировки документов

## Правила параллельной разработки
- Каждая фича — автономный блок: компоненты, API, store, типы
- **НЕ создавать** циклические зависимости между фичами
- Store — Zustand, можно использовать `persist` для localStorage
