import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, Query, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Ensure all models are imported so SQLAlchemy mappers are configured
import app.models  # noqa: F401

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import PerformanceMiddleware
from app.core.metrics import http_requests_total, http_request_duration, get_metrics
from app.core.mode import get_mode_config
from app.core.security_utils import is_secure_secret_key, limiter
from app.db.session import get_db, AsyncSessionLocal, primary_engine as engine
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text
from app.modules.collaboration import collaboration_websocket
from app.modules.collaboration.ws_manager import manager as ws_manager
from app.websocket.redis_pubsub import redis_pubsub


setup_logging()
logger = logging.getLogger("dokpotok")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Добавляет базовые security headers к HTTP-ответам."""

    async def dispatch(self, request: Request, call_next) -> Response:
        started_at = time.perf_counter()
        logger.debug("Request started: %s %s", request.method, request.url.path)

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled error while processing %s %s", request.method, request.url.path)
            raise

        duration = time.perf_counter() - started_at
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["X-Process-Time"] = f"{duration:.6f}"

        if request.headers.get("x-forwarded-proto") == "https" or request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        if request.url.path.startswith(settings.API_V1_STR):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"

        logger.debug(
            "Request finished: %s %s -> %s in %.4fs",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        return response


def add_middlewares(app: FastAPI) -> None:
    from app.core.audit_middleware import AuditMiddleware

    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(PerformanceMiddleware, threshold=1.0)
    app.add_middleware(AuditMiddleware)

    # Gzip compression for responses > 1KB
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    mode_config = get_mode_config()
    logger.info(
        "Starting %s v%s [MODE=%s]",
        settings.PROJECT_NAME,
        settings.VERSION,
        mode_config.mode,
    )
    app.state.mode = mode_config.mode
    app.state.started = True
    # Import all models to ensure SQLAlchemy mappers are configured
    import app.models  # noqa: F401
    from app.db.schema import ensure_schema

    await ensure_schema()
    await redis_pubsub.connect()
    # Демо-сид строго только в demo-режиме: двойная проверка режима и флага,
    # плюс проверка целевой БД внутри seed_demo_data().
    if mode_config.mode == "demo" and mode_config.features.demo_data_seed:
        from app.db.demo_seed import seed_demo_data

        await seed_demo_data()
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.state.ws_manager = ws_manager
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
add_middlewares(app)
register_exception_handlers(app)

# Подключаем основные роуты (включая все модули через api_router)
app.include_router(api_router)


@app.middleware("http")
async def metrics_middleware(request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start

    http_requests_total.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()

    http_request_duration.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)

    return response


@app.get("/metrics")
async def metrics():
    return get_metrics()


@app.websocket("/ws/ai/inline/{client_id}")
async def ai_inline_ws(websocket: WebSocket, client_id: str):
    from app.websocket.ai_ws import inline_ai_endpoint
    await inline_ai_endpoint(websocket, client_id)


@app.websocket("/ws")
async def collaboration_ws_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await collaboration_websocket(websocket, token, db)


@app.get("/")
async def root():
    return {
        "message": f"{settings.PROJECT_NAME} API is running",
        "version": settings.VERSION,
        "mode": get_mode_config().mode,
        "docs": "/docs",
        "openapi": f"{settings.API_V1_STR}/openapi.json",
        "health": "/health",
        "api_base": settings.API_V1_STR,
    }


async def _check_db() -> dict:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@app.get("/health")
async def health_check():
    db_check = await _check_db()
    if db_check["status"] != "ok":
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "service": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "database": db_check,
            },
        )
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_check,
    }


@app.get(f"{settings.API_V1_STR}/meta")
async def api_meta():
    """Режим работы и включённые функции — для фронтенда (без auth)."""
    mode_config = get_mode_config()
    return {
        "mode": mode_config.mode,
        "version": settings.VERSION,
        "features": mode_config.features.model_dump(),
    }


@app.get(f"{settings.API_V1_STR}/health")
async def api_health_check():
    db_check = await _check_db()
    if db_check["status"] != "ok":
        raise HTTPException(
            status_code=503,
            detail={
                "status": "error",
                "service": settings.PROJECT_NAME,
                "version": settings.VERSION,
                "api_base": settings.API_V1_STR,
                "database": db_check,
            },
        )
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_base": settings.API_V1_STR,
        "database": db_check,
    }


@app.get("/health/security")
async def security_health_check():
    return {
        "secret_key_valid": is_secure_secret_key(settings.SECRET_KEY),
        "rate_limiter": "redis" if "redis" in str(limiter._storage) else "memory",
        "recommendations": [],
    }


@app.get("/health/db")
async def health_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        pool_status = engine.pool.status() if hasattr(engine.pool, "status") else None
        return {"status": "ok", "pool": pool_status}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.get("/metrics/db")
async def db_metrics():
    pool = engine.pool
    return {
        "pool_size": pool.size() if hasattr(pool, "size") else None,
        "checked_in": pool.checkedin() if hasattr(pool, "checkedin") else None,
        "checked_out": pool.checkedout() if hasattr(pool, "checkedout") else None,
        "overflow": pool.overflow() if hasattr(pool, "overflow") else None,
        "max_overflow": getattr(pool, '_max_overflow', None),
        "pool_timeout": getattr(pool, '_timeout', None),
    }