# Модуль: Analytics (Аналитика)

## Назначение
Дашборд, KPI, портфельная аналитика, отчёты. Уровень 2.

## Файлы
```
backend/app/modules/analytics/
  router.py    # Множество эндпоинтов аналитики
  schemas.py   # KPI schemas
```

## Эндпоинты (`/api/v1/analytics`)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/dashboard` | KPI дашборда |
| GET | `/kpi` | 6 executive tiles |
| GET | `/portfolio` | Bubble chart (бюджет vs график) |
| GET | `/shipments/calendar` | Календарь отгрузок |
| GET | `/sparklines` | 30-дневные тренды |
| GET | `/alerts` | Авто-алерты |
| GET | `/tender-pipeline` | Воронка тендеров |
| GET | `/documents-by-project` | Документы по проектам |
| GET | `/production-sqcdp` | SQCDP метрики |

## KPI дашборда
- Активные проекты, всего документов, согласованных документов
- Открытые/критические замечания
- Средняя эффективность
- Project scorecard с health calculation
- Team performance

## Зависимости
- `auth`, `projects`, `documents`, `tasks`, `tenders`, `remarks`

## Правила параллельной разработки
- Часть данных — **mock** (shipments, sparklines)
- **НЕ удалять** существующие KPI без замены
- Новые метрики добавлять новыми эндпоинтами
