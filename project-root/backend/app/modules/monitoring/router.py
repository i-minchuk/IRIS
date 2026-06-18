"""Prometheus metrics middleware and endpoint."""
from __future__ import annotations

import time
import logging
from typing import Callable, Optional

from fastapi import APIRouter, Request, Response
from fastapi.routing import APIRoute
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

logger = logging.getLogger(__name__)
router = APIRouter()

# HTTP metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

http_request_size_bytes = Histogram(
    'http_request_size_bytes',
    'HTTP request size in bytes',
    ['method', 'endpoint'],
    buckets=[100, 1000, 10000, 100000, 1000000]
)

http_response_size_bytes = Histogram(
    'http_response_size_bytes',
    'HTTP response size in bytes',
    ['method', 'endpoint'],
    buckets=[100, 1000, 10000, 100000, 1000000]
)

# Custom business metrics
document_uploads_total = Counter(
    'document_uploads_total',
    'Total document uploads',
    ['doc_type', 'status']
)

ai_requests_total = Counter(
    'ai_requests_total',
    'Total AI requests',
    ['endpoint', 'status']
)

workflow_completions_total = Counter(
    'workflow_completions_total',
    'Total workflow completions',
    ['route_type', 'status']
)

auth_failures_total = Counter(
    'auth_failures_total',
    'Total authentication failures',
    ['reason']
)

# System metrics
db_connections_active = Gauge(
    'db_connections_active',
    'Active database connections'
)

qdrant_health = Gauge(
    'qdrant_health',
    'Qdrant health status (1=up, 0=down)'
)

active_users = Gauge(
    'active_users',
    'Number of active users'
)


class MetricsRoute(APIRoute):
    """Custom route that collects Prometheus metrics."""

    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            start_time = time.time()
            
            # Process request
            response = await original_route_handler(request)
            
            # Record metrics
            duration = time.time() - start_time
            method = request.method
            endpoint = request.url.path
            status_code = str(response.status_code)
            
            http_requests_total.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()
            
            http_request_duration_seconds.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            # Request/response sizes (if available)
            if request.headers.get('content-length'):
                http_request_size_bytes.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(int(request.headers['content-length']))
            
            if response.headers.get('content-length'):
                http_response_size_bytes.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(int(response.headers['content-length']))
            
            return response

        return custom_route_handler


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint."""
    from fastapi.responses import Response
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@router.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "ok", "timestamp": time.time()}


@router.get("/health/db")
async def db_health_check():
    """Database health check."""
    try:
        from app.db.session import primary_engine
        from sqlalchemy import text
        async with primary_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:
        logger.error("DB health check failed: %s", exc)
        return {"status": "error", "database": "disconnected", "error": str(exc)}


@router.get("/health/qdrant")
async def qdrant_health_check():
    """Qdrant health check."""
    try:
        from app.core.config import settings
        from qdrant_client import QdrantClient
        client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        client.get_collections()
        qdrant_health.set(1)
        return {"status": "ok", "qdrant": "connected"}
    except Exception as exc:
        qdrant_health.set(0)
        logger.warning("Qdrant health check failed: %s", exc)
        return {"status": "error", "qdrant": "disconnected"}
