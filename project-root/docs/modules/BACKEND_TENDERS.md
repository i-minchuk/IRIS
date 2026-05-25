# Модуль: Tenders (Тендеры)

## Назначение
Управление тендерным портфелем: портфель, расчёт, документы. Уровень 1.

## Файлы
```
backend/app/modules/tenders/
  router.py    # CRUD, portfolio summary, document preview, calculate
  models.py    # Tender, TenderDocumentPreview
  schemas.py   # Tender schemas
  calculator.py # Расчёт тендера
```

## Модели
- **Tender**: `name`, `customer`, `project_type`, `volume`, `complexity`, `standards`
  - `stage`, `nmc`, `our_price`, `margin_pct`, `probability`
  - `platform`, `region`, `responsible_id`
  - `auction_end_time`, `calculated_hours`, `calculated_cost`, `team_size`, `team_composition`
- **TenderDocumentPreview**: привязан к Tender

## Эндпоинты (`/api/v1/tenders`)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/` | Список |
| GET | `/portfolio` | KPI портфеля |
| POST | `/` | Создать |
| PUT | `/{id}/stage` | Сменить стадию |
| GET | `/{id}` | Получить |
| POST | `/{id}/calculate` | Расчёт трудоёмкости |
| GET | `/{id}/tasks` | Задачи тендера |

## Зависимости
- `auth`, `projects`

## Правила параллельной разработки
- `calculator.py` — эвристический расчёт, можно улучшать
- `stage` — строка (не enum), гибко для бизнес-процессов
