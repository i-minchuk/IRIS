# Модуль: Frontend API Client

## Назначение
Axios-клиент с интерцепторами, retry, refresh token, toast-уведомления.

## Файлы
```
frontend/src/shared/api/client.ts    # Базовый axios instance
frontend/src/api/                    # Legacy API-модули
frontend/src/features/*/api/         # Feature-specific API
```

## Client.ts
- Base URL: `/api/v1`
- Bearer token из localStorage
- **Retry**: до 3 раз при ECONNREFUSED/ECONNRESET, exponential backoff
- **Sentry**: `@sentry/react` для 5xx
- **Toast**: `sonner` для всех ошибок кроме 401
- **Refresh on 401**: вызов `/api/v1/auth/refresh`, fallback → logout + redirect

## API модули
| Модуль | Путь |
|--------|------|
| Auth | `features/auth/api/authApi.ts`, `adminApi.ts` |
| Dashboard | `api/dashboard.ts` |
| Documents | `api/documents.ts` |
| Projects | `features/projects/api/projects.ts` |
| Tasks | `api/tasks.ts` |
| Remarks | `api/remarks.ts` |
| Archive | `api/archive.ts`, `pages/ArchivePage/api/archiveApi.ts` |
| Tenders | `features/tenders/api/tenders.ts` |
| Time Tracking | `api/timeTracking.ts` |
| Users | `api/users.ts` |
| Workload | `api/workload.ts` |
| Variables | `features/variables/api/variables.ts` |
| AI | `features/ai/api/aiApi.ts` |
| Analytics | `features/analytics/api/analytics.ts` |
| Collaboration | `features/collaboration/api/lock.ts` |
| Resources | `features/resources/api/resources.ts` |

## Правила параллельной разработки
- **НЕ менять** логику refresh token без согласования
- Новые API-модули — создавать в `features/{name}/api/`
- Все ошибки API должны показывать toast (русский язык)
- Sentry — только для 5xx и сетевых ошибок
