"""In-memory WebSocket connection and presence manager."""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class PresenceState:
    def __init__(
        self,
        user_id: int,
        full_name: str,
        email: str,
        page: Optional[str] = None,
        document_id: Optional[int] = None,
    ):
        self.user_id = user_id
        self.full_name = full_name
        self.email = email
        self.page = page
        self.document_id = document_id
        self.joined_at = datetime.now(timezone.utc)
        self.last_seen = datetime.now(timezone.utc)
        self.ping_task: Optional[asyncio.Task] = None


class ConnectionManager:
    """Manages WebSocket connections, presence, and document subscriptions."""

    def __init__(self):
        # user_id -> WebSocket
        self.connections: dict[int, WebSocket] = {}
        # user_id -> PresenceState
        self.presence: dict[int, PresenceState] = {}
        # document_id -> set of user_ids
        self.document_subscribers: dict[int, set[int]] = {}
        # Max connections per user (защита от DoS)
        self.MAX_CONNECTIONS_PER_USER = 5
        # Heartbeat interval in seconds
        self.HEARTBEAT_INTERVAL = 30
        # Maximum missed pings before disconnect
        self.MAX_MISSED_PINGS = 3

    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        # Проверка: не более MAX_CONNECTIONS_PER_USER подключений
        if user_id in self.connections:
            # Закрываем старое соединение
            try:
                await self.connections[user_id].close(code=1008, reason="Multiple connections not allowed")
            except Exception:
                pass
        
        await websocket.accept()
        self.connections[user_id] = websocket

        # Запускаем heartbeat task
        if user_id not in self.presence:
            self.presence[user_id] = PresenceState(
                user_id=user_id,
                full_name="Unknown",
                email="unknown@example.com",
            )
        
        presence = self.presence[user_id]
        presence.last_seen = datetime.now(timezone.utc)
        
        # Cancel old ping task if exists
        if presence.ping_task and not presence.ping_task.done():
            presence.ping_task.cancel()
        
        # Start new heartbeat task
        presence.ping_task = asyncio.create_task(self._heartbeat_loop(user_id))

    async def _heartbeat_loop(self, user_id: int) -> None:
        """Send periodic pings to keep connection alive."""
        missed_pings = 0
        
        while user_id in self.connections:
            try:
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                
                if user_id not in self.connections:
                    break
                
                ws = self.connections[user_id]
                await ws.send_json({"type": "ping"})
                missed_pings += 1
                
                if missed_pings >= self.MAX_MISSED_PINGS:
                    logger.warning(f"User {user_id} missed {missed_pings} pings, disconnecting")
                    await self.force_disconnect(user_id)
                    break
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error for user {user_id}: {e}")
                break

    def disconnect(self, user_id: int) -> None:
        """Graceful disconnect."""
        self.connections.pop(user_id, None)
        
        if user_id in self.presence:
            presence = self.presence[user_id]
            if presence.ping_task and not presence.ping_task.done():
                presence.ping_task.cancel()
            self.presence.pop(user_id, None)
        
        for doc_id, subs in list(self.document_subscribers.items()):
            subs.discard(user_id)
            if not subs:
                self.document_subscribers.pop(doc_id, None)

    async def force_disconnect(self, user_id: int) -> None:
        """Force disconnect user."""
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.close(code=1011, reason="Connection timeout")
            except Exception:
                pass
        self.disconnect(user_id)

    async def send_to_user(self, user_id: int, message: dict) -> None:
        """Send message to specific user."""
        ws = self.connections.get(user_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Failed to send to user {user_id}: {e}")
                raise

    async def broadcast(self, message: dict, exclude_user_id: Optional[int] = None) -> None:
        """Broadcast message to all users."""
        for uid, ws in list(self.connections.items()):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.error(f"Broadcast failed for user {uid}: {e}")

    async def broadcast_to_document(self, document_id: int, message: dict, exclude_user_id: Optional[int] = None) -> None:
        """Broadcast message to all subscribers of a document."""
        for uid in self.document_subscribers.get(document_id, set()):
            if exclude_user_id is not None and uid == exclude_user_id:
                continue
            ws = self.connections.get(uid)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.error(f"Broadcast to document {document_id} failed for user {uid}: {e}")

    def set_presence(self, user_id: int, presence: PresenceState) -> None:
        """Update presence state."""
        presence.last_seen = datetime.now(timezone.utc)
        self.presence[user_id] = presence

    def subscribe_document(self, user_id: int, document_id: int) -> None:
        """Subscribe user to document updates."""
        self.document_subscribers.setdefault(document_id, set()).add(user_id)

    def unsubscribe_document(self, user_id: int, document_id: int) -> None:
        """Unsubscribe user from document."""
        subs = self.document_subscribers.get(document_id)
        if subs:
            subs.discard(user_id)
            if not subs:
                self.document_subscribers.pop(document_id, None)

    def get_document_subscribers(self, document_id: int) -> list[PresenceState]:
        """Get all subscribers for a document."""
        return [self.presence[uid] for uid in self.document_subscribers.get(document_id, set()) if uid in self.presence]

    def get_all_presence(self) -> list[PresenceState]:
        """Get all active users."""
        return list(self.presence.values())

    def get_online_users(self) -> list[int]:
        """Get list of online user IDs."""
        return list(self.connections.keys())

    def get_user_presence(self, user_id: int) -> Optional[PresenceState]:
        """Get presence state for a user."""
        return self.presence.get(user_id)


# Singleton instance
manager = ConnectionManager()
