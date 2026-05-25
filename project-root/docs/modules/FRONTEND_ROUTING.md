# Модуль: Frontend Routing & Layout

## Назначение
Маршрутизация React Router v7, защищённые роуты, основной Layout приложения.

## Файлы
```
frontend/src/app/
  router.tsx          # createBrowserRouter, все маршруты
  ProtectedRoute.tsx  # Pass-through <Outlet /> (placeholder)
  Layout.tsx          # Главный shell приложения
```

## Маршруты
| Path | Page | Lazy | Access |
|------|------|------|--------|
| `/` | LandingPage | Нет | Public |
| `/login` | LoginPage | Нет | Public |
| `/dashboard` | Dashboard | Да | Protected |
| `/projects` | ProjectsPage | Да | Protected |
| `/documents` | DocumentsPage | Да | Protected |
| `/workflow` | WorkflowPage | Да | Protected |
| `/remarks` | RemarksPage | Да | Protected |
| `/archive` | ArchivePage | Да | Protected |
| `/admin` | AdminPage | Да | Protected |

## Layout.tsx
- **Sticky header** с табами навигации, глобальным поиском, zoom-слайдером
- **Word-style zoom**: слайдер `0.75–1.5x` через `useZoomStore`, применяет CSS `zoom`
- **Theme toggle**: Sun/Moon иконки
- **Notifications**: dropdown с уведомлениями
- **User menu**: профиль, выход
- **Nav tabs**: Dashboard, Projects, Documents, Workflow, Archive

## Правила параллельной разработки
- **НЕ менять** структуру маршрутов без согласования
- Новые страницы — добавлять в `router.tsx` + `React.lazy`
- `ProtectedRoute` — placeholder, реальная проверка в API-интерцепторах
- Layout использует CSS-переменные (`var(--layout-bg)`, `var(--header-bg)`)
