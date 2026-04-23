import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import PerformanceMiddleware


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
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(PerformanceMiddleware, threshold=1.0)

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
    logger.info("Starting %s v%s", settings.PROJECT_NAME, settings.VERSION)
    app.state.started = True
    yield
    logger.info("Shutting down %s", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

add_middlewares(app)
register_exception_handlers(app)
app.include_router(api_router)


@app.websocket("/ws/ai/inline/{client_id}")
async def ai_inline_ws(websocket: WebSocket, client_id: str):
    from app.websocket.ai_ws import inline_ai_endpoint

    await inline_ai_endpoint(websocket, client_id)


@app.get("/")
async def root():
    return {
        "message": f"{settings.PROJECT_NAME} API is running",
        "version": settings.VERSION,
        "docs": "/docs",
        "openapi": f"{settings.API_V1_STR}/openapi.json",
        "health": "/health",
        "api_base": settings.API_V1_STR,
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


@app.get(f"{settings.API_V1_STR}/health")
async def api_health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "api_base": settings.API_V1_STR,
    }