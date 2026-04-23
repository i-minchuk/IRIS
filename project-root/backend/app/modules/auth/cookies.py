"""Cookie utilities for secure token storage."""
from datetime import timedelta

from fastapi import Response

from app.core.config import settings


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Set HttpOnly cookies for access and refresh tokens."""
    
    # Access token cookie (короткоживущий)
    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,  # Недоступен для JS
        secure=True,    # Только HTTPS (в production)
        samesite="lax", # Защита от CSRF
        path="/api/auth",
    )
    
    # Refresh token cookie (долгоживущий)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        httponly=True,  # Недоступен для JS
        secure=True,    # Только HTTPS (в production)
        samesite="lax", # Защита от CSRF
        path="/api/auth",
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear auth cookies."""
    response.delete_cookie(
        key="access_token",
        path="/api/auth",
    )
    response.delete_cookie(
        key="refresh_token",
        path="/api/auth",
    )
