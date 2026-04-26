"""Performance monitoring middleware."""

import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class PerformanceMiddleware(BaseHTTPMiddleware):
    """Middleware to monitor and log slow requests."""
    
    def __init__(self, app, threshold: float = 1.0):
        super().__init__(app)
        self.threshold = threshold
    
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        if duration > self.threshold:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {duration:.2f}s"
            )
        
        response.headers["X-Process-Time"] = str(duration)
        
        return response
