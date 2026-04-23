from fastapi import APIRouter

from app.api.routes import ai
from app.core.config import settings
from app.modules.analytics import router as analytics_router
from app.modules.auth import router as auth_router
from app.modules.collaboration import router as collaboration_router
from app.modules.documents import router as documents_router
from app.modules.gamification import router as gamification_router
from app.modules.projects import router as projects_router
from app.modules.resources import router as resources_router
from app.modules.tenders import router as tenders_router
from app.modules.time_tracking import router as time_tracking_router
from app.modules.variables import router as variables_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
api_router.include_router(gamification_router, prefix=f"{settings.API_V1_STR}/gamification", tags=["gamification"])
api_router.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["projects"])
api_router.include_router(documents_router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
api_router.include_router(variables_router, prefix=f"{settings.API_V1_STR}/variables", tags=["variables"])
api_router.include_router(time_tracking_router, prefix=f"{settings.API_V1_STR}/time-tracking", tags=["time-tracking"])
api_router.include_router(tenders_router, prefix=f"{settings.API_V1_STR}/tenders", tags=["tenders"])
api_router.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
api_router.include_router(resources_router, prefix=f"{settings.API_V1_STR}/resources", tags=["resources"])
api_router.include_router(collaboration_router, prefix=f"{settings.API_V1_STR}/collaboration", tags=["collaboration"])
api_router.include_router(ai.router)