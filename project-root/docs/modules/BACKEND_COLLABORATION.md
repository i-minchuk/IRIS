# Модуль: Collaboration (Совместная работа)

## Назначение
Real-time collaboration через WebSocket: presence, блокировка документов, подписки. Уровень 2.

## Файлы
```
backend/app/modules/collaboration/
  router.py    # WebSocket handler
  schemas.py   # WSMessage types
  ws_manager.py # ConnectionManager singleton
```

## ConnectionManager
- `user_id` → `WebSocket` mapping
- Presence state (кто онлайн, на каком документе)
- Document subscribers (broadcast по документу)
- Heartbeat: ping каждые 30с, max 3 пропуска → disconnect
- Max 5 соединений на пользователя

## WSMessage типы
- `presence_join/leave/update`
- `subscribe_document/unsubscribe_document`
- `document_locked/unlocked`
- `document_subscribers`
- `ping/pong/error`

## WebSocket эндпоинты
- `/ws` — collaboration (в `main.py`)
- `/ws/ai/inline/{client_id}` — inline AI (в `app/websocket/ai_ws.py`)

## Зависимости
- `auth` (JWT через query-param `?token=`)

## Правила параллельной разработки
- ConnectionManager — **singleton**, инициализируется в `main.py`
- **НЕ менять** сообщения без обновления frontend `CollaborationProvider`
- Heartbeat логика — критична, тестировать при изменениях
