# backend/app/core/security.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT claims constants
JWT_ISSUER = "iris-backend"
JWT_AUDIENCE = "iris-frontend"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def _add_jwt_claims(to_encode: dict, token_type: str) -> dict:
    """Add standard JWT claims: iss, aud, jti, iat."""
    now = datetime.now(timezone.utc)
    to_encode["iss"] = JWT_ISSUER
    to_encode["aud"] = JWT_AUDIENCE
    to_encode["jti"] = str(uuid4())
    to_encode["iat"] = now
    to_encode["type"] = token_type
    return to_encode


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode["exp"] = expire
    to_encode = _add_jwt_claims(to_encode, "access")
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode["exp"] = expire
    to_encode = _add_jwt_claims(to_encode, "refresh")
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_reset_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    to_encode["exp"] = expire
    to_encode = _add_jwt_claims(to_encode, "reset")
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_reset_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
        )
        token_type: str | None = payload.get("type")
        if token_type != "reset":
            return None
        return payload
    except Exception:
        return None