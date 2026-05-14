from fastapi import APIRouter

from app.api.routes import ai
from app.core.config import settings
from app.modules.analytics import router as analytics_router
from app.modules.auth import router as auth_router
from app.modules.collaboration import router as collaboration_router
from app.modules.documents.router_simple import router as documents_router
from app.modules.gamification import router as gamification_router
from app.modules.projects import router as projects_router
from app.modules.resources import router as resources_router
from app.modules.remarks import router as remarks_router
from app.modules.tasks import router as tasks_router
from app.modules.tenders import router as tenders_router
from app.modules.time_tracking import router as time_tracking_router
from app.modules.variables import router as variables_router
from app.modules.workflow.router import router as workflow_router
from app.api.v1.endpoints import archive as archive_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
api_router.include_router(gamification_router, prefix=f"{settings.API_V1_STR}/gamification", tags=["Gamification"])
api_router.include_router(projects_router, prefix=f"{settings.API_V1_STR}/projects", tags=["Projects"])
api_router.include_router(tasks_router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
api_router.include_router(documents_router, prefix=f"{settings.API_V1_STR}/documents", tags=["Documents"])
api_router.include_router(variables_router, prefix=f"{settings.API_V1_STR}/variables", tags=["Variables"])
api_router.include_router(time_tracking_router, prefix=f"{settings.API_V1_STR}/time-tracking", tags=["Time Tracking"])
api_router.include_router(tenders_router, prefix=f"{settings.API_V1_STR}/tenders", tags=["Tenders"])
api_router.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
api_router.include_router(resources_router, prefix=f"{settings.API_V1_STR}/resources", tags=["Resources"])
api_router.include_router(collaboration_router, prefix=f"{settings.API_V1_STR}/collaboration", tags=["Collaboration"])
api_router.include_router(archive_router.router, prefix=f"{settings.API_V1_STR}/archive", tags=["Archive"])
api_router.include_router(workflow_router, prefix=f"{settings.API_V1_STR}/workflows", tags=["Workflows"])
api_router.include_router(remarks_router, prefix=f"{settings.API_V1_STR}/remarks", tags=["Remarks"])