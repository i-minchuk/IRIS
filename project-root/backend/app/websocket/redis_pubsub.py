import json
import asyncio
import redis.asyncio as aioredis
from typing import Callable, Dict, Set
from app.core.config import settings


class RedisPubSub:
    def __init__(self):
        self.redis = None
        self.pubsub = None
        self.channels: Dict[str, Set[Callable]] = {}

    async def connect(self):
        try:
            self.redis = aioredis.from_url(settings.REDIS_URL)
            self.pubsub = self.redis.pubsub()
            await self.pubsub.subscribe("ws:broadcast")
            asyncio.create_task(self._listener())
        except Exception:
            pass

    async def _listener(self):
        if not self.pubsub:
            return
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                channel = data.get("channel", "ws:broadcast")
                for handler in self.channels.get(channel, []):
                    await handler(data["payload"])

    async def publish(self, channel: str, payload: dict):
        if self.redis:
            await self.redis.publish(
                "ws:broadcast",
                json.dumps({"channel": channel, "payload": payload}),
            )

    def subscribe(self, channel: str, handler: Callable):
        if channel not in self.channels:
            self.channels[channel] = set()
        self.channels[channel].add(handler)

    def unsubscribe(self, channel: str, handler: Callable):
        self.channels.get(channel, set()).discard(handler)


redis_pubsub = RedisPubSub()
