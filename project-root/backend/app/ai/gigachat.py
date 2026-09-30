"""GigaChat (Sber) адаптер.

Ключ в формате base64(client_id:client_secret). Получает access_token через
OAuth2 client credentials, после чего использует OpenAI-compatible API.
"""
from __future__ import annotations

import base64
import logging
import time
import uuid
from typing import Any, Dict, Optional

import httpx
from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class GigaChatAuthError(Exception):
    pass


class GigaChatClient:
    """Async OpenAI-compatible client for GigaChat."""

    def __init__(self, credentials: str):
        self._credentials = credentials.strip()
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0
        # GigaChat использует российские сертификаты, которые могут не быть
        # доверенны в стандартном хранилище Python. Отключаем verify для auth.
        self._http = httpx.AsyncClient(timeout=30.0, verify=False)

    def _decode_credentials(self) -> tuple[str, str]:
        """Декодирует base64(client_id:client_secret)."""
        try:
            decoded = base64.b64decode(self._credentials).decode("utf-8")
        except Exception as exc:
            raise GigaChatAuthError(f"Некорректный формат GigaChat credentials: {exc}") from exc

        if ":" not in decoded:
            # Может быть уже client_id:client_secret без base64
            decoded = self._credentials

        parts = decoded.split(":", 1)
        if len(parts) != 2:
            raise GigaChatAuthError("GigaChat credentials должны быть в формате client_id:client_secret")
        return parts[0], parts[1]

    async def _ensure_token(self) -> str:
        """Получает или обновляет access_token."""
        if self._access_token and time.time() < self._token_expires_at - 60:
            return self._access_token

        client_id, client_secret = self._decode_credentials()
        auth_string = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()

        try:
            response = await self._http.post(
                settings.GIGACHAT_AUTH_URL,
                headers={
                    "Authorization": f"Basic {auth_string}",
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json",
                    "RqUID": str(uuid.uuid4()),
                },
                data={"scope": "GIGACHAT_API_PERS"},
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error("GigaChat auth failed: %s - %s", exc.response.status_code, exc.response.text)
            raise GigaChatAuthError(f"GigaChat auth error {exc.response.status_code}: {exc.response.text}") from exc
        except Exception as exc:
            logger.error("GigaChat auth request failed: %s", exc)
            raise GigaChatAuthError(f"GigaChat auth request failed: {exc}") from exc

        self._access_token = data.get("access_token")
        if not self._access_token:
            raise GigaChatAuthError(f"GigaChat auth response missing access_token: {data}")

        expires_in = data.get("expires_in", 1800)
        self._token_expires_at = time.time() + int(expires_in)
        logger.info("GigaChat access token obtained, expires in %s seconds", expires_in)
        return self._access_token

    async def get_openai_client(self) -> AsyncOpenAI:
        """Возвращает AsyncOpenAI клиент, настроенный на GigaChat API."""
        token = await self._ensure_token()
        # verify=False для совместимости с российскими сертификатами GigaChat.
        http_client = httpx.AsyncClient(timeout=120.0, verify=False)
        return AsyncOpenAI(
            api_key=token,
            base_url=f"{settings.GIGACHAT_BASE_URL.rstrip('/')}/v1",
            http_client=http_client,
        )

    async def chat_completions_create(self, **kwargs: Any) -> Dict[str, Any]:
        """Прямой вызов chat/completions с автоматическим получением токена."""
        client = await self.get_openai_client()
        return await client.chat.completions.create(**kwargs)

    async def embeddings_create(self, **kwargs: Any) -> Dict[str, Any]:
        """Прямой вызов embeddings с автоматическим получением токена."""
        client = await self.get_openai_client()
        return await client.embeddings.create(**kwargs)


def is_gigachat_credentials(key: Optional[str]) -> bool:
    """True, если ключ похож на GigaChat credentials (base64 client_id:client_secret)."""
    if not key:
        return False
    key = key.strip()
    if key.startswith("sk-"):
        return False
    try:
        decoded = base64.b64decode(key).decode("utf-8")
        return ":" in decoded and len(decoded.split(":")) == 2
    except Exception:
        # Возможно, уже raw client_id:client_secret
        return ":" in key and len(key.split(":")) == 2


async def create_ai_client(key: Optional[str]) -> AsyncOpenAI:
    """Фабрика: возвращает OpenAI или GigaChat клиент в зависимости от ключа."""
    if not key:
        raise ValueError("AI API ключ не задан")

    if is_gigachat_credentials(key):
        gc = GigaChatClient(key)
        return await gc.get_openai_client()

    return AsyncOpenAI(api_key=key, base_url=settings.OPENAI_BASE_URL)
