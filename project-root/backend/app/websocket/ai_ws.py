from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json
from uuid import UUID

from app.ai.service import AIService
from app.ai.models import InlineSuggestionRequest


class AIConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)

    async def send_suggestion(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(data)


manager = AIConnectionManager()


def _get_ai_service() -> AIService:
    from app.ai.service import AIService
    return AIService()


async def inline_ai_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket для inline-подсказок при редактировании"""
    await manager.connect(websocket, client_id)
    ai_service = _get_ai_service()

    try:
        while True:
            data = await websocket.receive_json()

            if data["type"] == "text_change":
                context = data.get("context", {})

                # Формируем запрос
                request = InlineSuggestionRequest(
                    document_id=_parse_uuid(context.get("document_id")),
                    document_type=context.get("document_type"),
                    current_section=context.get("current_section"),
                    preceding_text=context.get("preceding_text", ""),
                    current_line=context.get("current_line", ""),
                    cursor_position=context.get("cursor_position", 0)
                )

                # Получаем подсказки от AI
                try:
                    response = await ai_service.get_inline_suggestions(request)
                    if response.suggestions:
                        await manager.send_suggestion(client_id, {
                            "type": "suggestions",
                            "items": [
                                {
                                    "type": s.type,
                                    "text": s.text,
                                    "display": s.display,
                                    "confidence": s.confidence,
                                    "description": s.description
                                }
                                for s in response.suggestions
                            ],
                            "request_id": str(response.request_id)
                        })
                except Exception:
                    # Молча игнорируем ошибки AI — не мешаем пользователю
                    pass

            elif data["type"] == "accept_suggestion":
                # Логируем для обучения (можно добавить analytics позже)
                pass

            elif data["type"] == "reject_suggestion":
                # Логируем отказ
                pass

    except WebSocketDisconnect:
        manager.disconnect(client_id)


def _parse_uuid(value) -> UUID | None:
    if not value:
        return None
    try:
        return UUID(str(value))
    except (ValueError, TypeError):
        return None
