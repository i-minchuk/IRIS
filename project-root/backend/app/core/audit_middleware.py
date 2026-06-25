"""Audit logging middleware — automatically log all mutating requests."""
from __future__ import annotations

import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.modules.audit.router import log_audit

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware that automatically logs mutating requests."""

    # Actions that should be logged
    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
    
    # Endpoints to skip (health checks, metrics, etc.)
    SKIP_PATHS = {
        "/health",
        "/metrics",
        "/docs",
        "/openapi.json",
        "/redoc",
        "/api/v1/auth/login",
        "/api/v1/auth/refresh",
    }

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log if it's a mutating operation."""
        # Skip non-mutating methods and excluded paths
        if request.method not in self.MUTATING_METHODS:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(skip) for skip in self.SKIP_PATHS):
            return await call_next(request)

        # Get user info from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        user_email = getattr(request.state, "user_email", None)

        # Process request
        response = await call_next(request)

        # Log the action
        try:
            from app.db.session import get_db
            # We can't easily get DB session here, so log basic info
            entity_type = self._extract_entity_type(path)
            entity_id = self._extract_entity_id(path)
            action = request.method.lower()

            logger.info(
                "Audit: %s %s by user=%s entity=%s id=%s status=%s",
                action, path, user_id, entity_type, entity_id, response.status_code
            )
        except Exception:
            pass

        return response

    def _extract_entity_type(self, path: str) -> str:
        """Extract entity type from URL path."""
        parts = path.strip("/").split("/")
        # Handle paths like /api/v1/documents/123
        if len(parts) >= 3 and parts[0] == "api":
            return parts[2] if len(parts) > 2 else "unknown"
        return parts[0] if parts else "unknown"

    def _extract_entity_id(self, path: str) -> str:
        """Extract entity ID from URL path."""
        parts = path.strip("/").split("/")
        # Look for numeric ID in path
        for part in parts:
            if part.isdigit():
                return part
        return None
