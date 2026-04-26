from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
from app.ai.prompts import INLINE_SUGGESTION_PROMPT

class ConnectionManager:
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

manager = ConnectionManager()

async def inline_ai_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket для inline-подсказок при редактировании"""
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            if data["type"] == "text_change":
                # Анализируем контекст
                context = data.get("context", {})
                
                # Простая эвристика для MVP
                current_line = context.get("current_line", "")
                
                suggestions = []
                
                # Если упоминается ГОСТ — предложить номер
                if "ГОСТ" in current_line and not any(c.isdigit() for c in current_line.split("ГОСТ")[-1][:10]):
                    suggestions.append({
                        "type": "reference",
                        "text": "ГОСТ 3262-75",
                        "display": "📖 ГОСТ 3262-75",
                        "confidence": 0.85,
                        "description": "Стандартный ГОСТ для трубопроводов"
                    })
                
                # Если размер — предложить стандартные
                if any(x in current_line for x in ["DN", "Ду", "мм"]):
                    suggestions.append({
                        "type": "completion",
                        "text": "DN100 (Ду 100 мм)",
                        "display": "✨ DN100 (Ду 100 мм)",
                        "confidence": 0.9,
                        "description": "Стандартный диаметр"
                    })
                
                if suggestions:
                    await manager.send_suggestion(client_id, {
                        "type": "suggestions",
                        "items": suggestions
                    })
            
            elif data["type"] == "accept_suggestion":
                # Логируем для обучения
                pass
            
            elif data["type"] == "reject_suggestion":
                # Логируем отказ
                pass
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)