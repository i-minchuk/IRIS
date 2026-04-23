# app/main.py
import logging
from fastapi import FastAPI, WebSocket, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.middleware import PerformanceMiddleware
from app.modules.auth import router as auth_router
from app.modules.gamification import router as gamification_router
from app.modules.projects import router as projects_router
from app.modules.documents import router as documents_router
from app.modules.variables import router as variables_router
from app.modules.time_tracking import router as time_tracking_router
from app.modules.tenders import router as tenders_router
from app.modules.analytics import router as analytics_router
from app.modules.resources import router as resources_router
from app.modules.collaboration import router as collaboration_router
from app.modules.collaboration.router import collaboration_websocket
from app.db.session import get_db
from app.api.routes import ai  # Новый роутер

# Настроить логирование
setup_logging()
logger = logging.getLogger("dokpotok")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware для добавления security headers."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        logger.debug(f"Request: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            logger.debug(f"Response: {response.status_code}")
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
        
        # X-Content-Type-Options: Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # X-Frame-Options: Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # X-XSS-Protection: Legacy XSS protection (для старых браузеров)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer-Policy: Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions-Policy: Disable unnecessary features
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS: HTTP Strict Transport Security (только для HTTPS в production)
        # Для development не добавляем, чтобы не было проблем с localhost
        if request.headers.get("x-forwarded-proto") == "https" or request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        
        # Cache-Control для API ответов (не кэшировать чувствительные данные)
        if request.url.path.startswith("/api"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
        
        return response


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Performance Monitoring Middleware
app.add_middleware(PerformanceMiddleware, threshold=1.0)

# Настройка CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Подключаем роутеры
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(gamification_router, prefix=f"{settings.API_V1_STR}/gamification", tags=["gamification"])
app.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
app.include_router(documents_router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(variables_router, prefix=f"{settings.API_V1_STR}/variables", tags=["variables"])
app.include_router(time_tracking_router, prefix=f"{settings.API_V1_STR}/time-tracking", tags=["time-tracking"])
app.include_router(tenders_router, prefix=f"{settings.API_V1_STR}/tenders", tags=["tenders"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
app.include_router(resources_router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])
app.include_router(collaboration_router, prefix=f"{settings.API_V1_STR}/collaboration", tags=["collaboration"])
# Подключаем AI роутеры
app.include_router(ai.router)

@app.websocket("/ws"/ai/inline/{client_id}")
async def ws_endpoint(websocket: WebSocket, db: AsyncSession = Depends(get_db)):
    token = websocket.query_params.get("token")
    origin = websocket.headers.get("origin")
    
    # Проверка origin (защита от CSRF для WebSocket)
    if origin:
        allowed_origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
        if origin not in allowed_origins:
            await websocket.close(code=1008, reason="Origin not allowed")
            return
    
    if not token:
        await websocket.close(code=1008, reason="Token required")
        return
    await collaboration_websocket(websocket, token, db)

async def ai_inline_ws(websocket: WebSocket, client_id: str):
    from app.websocket.ai_ws import inline_ai_endpoint
    await inline_ai_endpoint(websocket, client_id)


@app.get("/health")
async def health_check():
    logger.info("Health check requested")
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/api/health",
    }
