# Модуль: Resources (Загрузка и теплокарта)

## Назначение
Расчёт загрузки команды и теплокарта по отделам. Уровень 2.

## Файлы
```
backend/app/modules/resources/
  router.py    # /workload, /heatmap
  schemas.py   # WeeklyLoad, UserWorkload, WorkloadResponse, HeatmapResponse
  service.py   # WorkloadService
  deps.py      # DI
  repository.py # WorkloadRepository
```

## WorkloadService
- Генерация 4-недельных диапазонов
- Расчёт utilization status (underload/normal/overload/critical)
- Кэширование (5 минут in-memory)

## Эндпоинты (`/api/v1/resources`)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/workload` | Загрузка по команде |
| GET | `/heatmap` | Теплокарта по отделам |

## Зависимости
- `auth`, `tasks`, `time_tracking`

## Правила параллельной разработки
- Кэш 5 минут — можно сбрасывать при изменении задач
- Heatmap агрегирует по `WorkCenter` → `department`
