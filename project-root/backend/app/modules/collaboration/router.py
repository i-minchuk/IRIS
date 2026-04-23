"""Collaboration WebSocket and REST API."""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import ValidationError

from app.core.config import settings
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.documents.models import Document
from app.modules.collaboration.ws_manager import ConnectionManager, PresenceState, manager
from app.modules.collaboration.schemas import WSMessage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["collaboration"])


def _decode_ws_token(token: str) -> Optional[int]:
    """Decode WebSocket authentication token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        if user_id is None or token_type != "access":
            return None
        return int(user_id)
    except JWTError:
        return None


async def _unlock_user_documents(user_id: int, db: AsyncSession) -> None:
    """Unlock all documents locked by this user."""
    result = await db.execute(select(Document).where(Document.locked_by_id == user_id))
    docs = result.scalars().all()
    for doc in docs:
        doc.locked_by_id = None
        doc.locked_at = None
    if docs:
        await db.commit()
        # Notify subscribers that documents were unlocked
        for doc in docs:
            await manager.broadcast_to_document(
                doc.id,
                {
                    "type": "document_unlocked",
                    "payload": {"document_id": doc.id, "unlocked_by": user_id},
                },
            )


async def collaboration_websocket(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """WebSocket handler для real-time коллаборации."""
    user_id = _decode_ws_token(token)
    if user_id is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid or expired token")
        return

    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found or inactive")
        return

    await manager.connect(user.id, websocket)
    manager.set_presence(
        user.id,
        PresenceState(
            user_id=user.id,
            full_name=user.full_name or user.email,
            email=user.email,
            page=None,
            document_id=None,
        ),
    )

    # Сообщаем другим пользователям о присоединении
    await manager.broadcast(
        {
            "type": "presence_join",
            "payload": {
                "user_id": user.id,
                "full_name": user.full_name or user.email,
                "email": user.email,
                "page": None,
                "document_id": None,
            },
        },
    )

    try:
        while True:
            # Ограничение размера сообщения (64KB)
            try:
                data = await websocket.receive_text()
            except Exception as e:
                # Обработка ошибок чтения
                logger.warning(f"WebSocket receive error for user {user.id}: {e}")
                break
            
            if len(data) > 65536:
                try:
                    await manager.send_to_user(user.id, {
                        "type": "error",
                        "payload": {"detail": "Message too large"}
                    })
                except Exception:
                    pass  # Connection may be closed
                continue

            # Парсинг JSON
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                try:
                    await manager.send_to_user(user.id, {
                        "type": "error",
                        "payload": {"detail": "Invalid JSON"}
                    })
                except Exception:
                    pass
                continue
            
            # Валидация сообщения через Pydantic
            try:
                ws_message = WSMessage(**data)
            except ValidationError as e:
                try:
                    await manager.send_to_user(user.id, {
                        "type": "error",
                        "payload": {"detail": f"Invalid message format: {str(e)}"}
                    })
                except Exception:
                    pass
                continue
            
            msg_type = ws_message.type
            payload = ws_message.payload or {}

            if msg_type == "presence_update":
                presence = manager.presence.get(user.id)
                if presence:
                    presence.page = payload.get("page")
                    presence.document_id = payload.get("document_id")
                try:
                    await manager.broadcast(
                        {
                            "type": "presence_update",
                            "payload": {
                                "user_id": user.id,
                                "full_name": user.full_name or user.email,
                                "email": user.email,
                                "page": payload.get("page"),
                                "document_id": payload.get("document_id"),
                            },
                        },
                        exclude_user_id=user.id,
                    )
                except Exception as e:
                    logger.error(f"Broadcast presence update failed: {e}")

            elif msg_type == "subscribe_document":
                doc_id = payload.get("document_id")
                if doc_id is not None:
                    manager.subscribe_document(user.id, doc_id)
                    subscribers = manager.get_document_subscribers(doc_id)
                    try:
                        await manager.send_to_user(
                            user.id,
                            {
                                "type": "document_subscribers",
                                "payload": {
                                    "document_id": doc_id,
                                    "subscribers": [
                                        {
                                            "user_id": s.user_id,
                                            "full_name": s.full_name,
                                            "email": s.email,
                                        }
                                        for s in subscribers
                                    ],
                                },
                            },
                        )
                    except Exception:
                        pass
                    
                    # Notify others
                    try:
                        await manager.broadcast_to_document(
                            doc_id,
                            {
                                "type": "presence_update",
                                "payload": {
                                    "user_id": user.id,
                                    "full_name": user.full_name or user.email,
                                    "email": user.email,
                                    "page": "documents",
                                    "document_id": doc_id,
                                },
                            },
                            exclude_user_id=user.id,
                        )
                    except Exception as e:
                        logger.error(f"Broadcast to document failed: {e}")

            elif msg_type == "unsubscribe_document":
                doc_id = payload.get("document_id")
                if doc_id is not None:
                    manager.unsubscribe_document(user.id, doc_id)

            elif msg_type == "ping":
                try:
                    await manager.send_to_user(user.id, {"type": "pong"})
                except Exception:
                    pass

            elif msg_type == "pong":
                # Received pong response - update last_seen
                presence = manager.presence.get(user.id)
                if presence:
                    presence.last_seen = datetime.now(timezone.utc)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for user {user.id}")
    except Exception as e:
        logger.error(f"WebSocket error for user {user.id}: {e}")
    finally:
        manager.disconnect(user.id)
        try:
            await _unlock_user_documents(user.id, db)
        except Exception as e:
            logger.error(f"Error unlocking documents: {e}")
        
        try:
            await manager.broadcast(
                {
                    "type": "presence_leave",
                    "payload": {"user_id": user.id},
                },
                exclude_user_id=user.id,
            )
        except Exception:
            pass
