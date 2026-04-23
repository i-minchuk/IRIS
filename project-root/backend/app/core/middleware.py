"""Performance monitoring middleware."""

import time
import logging

from fastapi import Request, Response

logger = logging.getLogger(__name__)


class PerformanceMiddleware:
    """Middleware to monitor and log slow requests."""
    
    def __init__(self, app, threshold: float = 1.0):
        self.app = app
        self.threshold = threshold
    
    async def __call__(self, request: Request, call_next):
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
