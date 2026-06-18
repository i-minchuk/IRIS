"""Integrations module router — combines 1C and gateway sub-routers."""
from fastapi import APIRouter

from app.modules.integrations._1c.router import router as _1c_router
from app.modules.integrations.gateway import router as gateway_router

router = APIRouter()
router.include_router(_1c_router, prefix="/1c")
router.include_router(gateway_router, prefix="/gateway")
