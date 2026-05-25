# Модуль: Gamification (Геймификация)

## Назначение
Мотивация инженеров: уровни, бейджи, лидерборд, ежедневные квесты, комбо. Уровень 2.

## Файлы
```
backend/app/modules/gamification/
  router.py    # Leaderboard, profile, badges, quests, notifications
  models.py    # EngineerMetric, GamificationEvent, GamificationBadge, DailyQuest, ComboAchievement, Notification
  schemas.py   # BadgeDefinition, GamificationProfile, LeaderboardEntry, QuestResponse, NotificationResponse
  service.py   # GamificationService
```

## Модели
- **EngineerMetric** (1:1 к User): `experience`, `level`, `documents_created`, `approvals_given`, `remarks_resolved`, `tasks_completed`, `streak_days`
- **GamificationEvent**: `user_id`, `event_type`, `points`, `metadata`
- **GamificationBadge**: `code`, `name`, `description`, `icon`, `criteria`
- **DailyQuest**: `user_id`, `quest_type`, `target`, `progress`, `completed`, `date`
- **ComboAchievement**: `user_id`, `combo_type`, `current_streak`, `max_streak`
- **Notification**: `user_id`, `type`, `title`, `message`, `is_read`, `link`

## GamificationService
- `award_event` — начисление очков, обновление метрик, проверка бейджей
- `get_profile` — расчёт уровня (5 уровней: Новичок → Мастер)
- `get_leaderboard` — топ инженеров (админы исключаются)

## Эндпоинты (`/api/v1/gamification`)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/leaderboard` | Топ инженеров |
| GET | `/profile` | Мой профиль |
| GET | `/badges` | Доступные бейджи |
| GET | `/notifications` | Уведомления |
| PUT | `/notifications/{id}/read` | Прочитать |
| GET | `/quests` | Ежедневные квесты |
| PUT | `/quests/{id}/progress` | Обновить прогресс |

## Зависимости
- `auth` (level 0)

## Правила параллельной разработки
- **EngineerMetric** — 1:1 к User, создаётся при первом `award_event`
- Уровни: формула в `service.py` — можно менять пороги
- `points` — Integer, можно добавлять новые типы событий в enum
