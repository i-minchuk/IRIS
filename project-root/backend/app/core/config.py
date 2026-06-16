from __future__ import annotations

from pathlib import Path
import warnings
import secrets 
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


def is_secure_secret_key(secret_key: str) -> bool:
    """Проверка SECRET_KEY на безопасность для production."""
    if not secret_key or len(secret_key) < 32:
        return False

    default_keys = [
        "your-super-secret-key-change-in-production-please",
        "change-me-in-production-min-32-chars-long",
        "secret",
        "password",
        "12345678901234567890123456789012",
        "admin",
        "root",
        "toor",
        "qwerty",
        "12345678",
    ]

    if secret_key.lower() in [k.lower() for k in default_keys]:
        return False

    # Проверка энтропии
    has_upper = any(c.isupper() for c in secret_key)
    has_lower = any(c.islower() for c in secret_key)
    has_digit = any(c.isdigit() for c in secret_key)
    has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in secret_key)

    score = sum([has_upper, has_lower, has_digit, has_special])
    return score >= 3  # Минимум 3 из 4 категорий


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / ".env", BASE_DIR / ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "ДокПоток IRIS"
    VERSION: str = "4.3.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres@localhost:5432/iris"
    )
    DATABASE_REPLICA_URL: Optional[str] = Field(default=None)

    SECRET_KEY: str = Field(
        default="your-super-secret-key-change-in-production-please"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:80",
        "http://127.0.0.1:80",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    IRIS_LOG_LEVEL: str = "INFO"
    IRIS_STORAGE_ROOT: str = "/app/storage"

    DEBUG: bool = False

    REDIS_URL: str = "redis://localhost:6379"

    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 3600
    DB_POOL_PRE_PING: bool = True
    DB_ECHO: bool = False

    # AI настройки — ВСЕ с default, чтобы CI не падал
    OPENAI_API_KEY: Optional[str] = Field(default=None)
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o"
    EMBEDDING_MODEL: str = "text-embedding-3-large"
    
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "docpotok_mvp"
    
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_CONTEXT_TOKENS: int = 8000

    TELEGRAM_BOT_TOKEN: Optional[str] = None

    ENCRYPTION_KEY: Optional[str] = None

    # Email
    SENDGRID_API_KEY: Optional[str] = Field(default=None)
    FROM_EMAIL: str = "noreply@dokpotok.ru"

    # SAML / SSO
    BASE_URL: str = "http://localhost:8000"
    SAML_SP_CERT: Optional[str] = None
    SAML_SP_KEY: Optional[str] = None
    SAML_IDP_ENTITY_ID: Optional[str] = None
    SAML_IDP_SSO_URL: Optional[str] = None
    SAML_IDP_CERT: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if not is_secure_secret_key(self.SECRET_KEY):
            msg = (
                "CRITICAL: SECRET_KEY is not secure for production! "
                "Generate a secure key with: python -c \"import secrets; print(secrets.token_urlsafe(32))\" "
                "and set it via SECRET_KEY environment variable."
            )
            if not self.DEBUG:
                raise ValueError(msg)
            warnings.warn(msg, UserWarning, stacklevel=2)

        if not self.BACKEND_CORS_ORIGINS:
            warnings.warn(
                "WARNING: BACKEND_CORS_ORIGINS is empty. "
                "Set specific origins for production!",
                UserWarning,
                stacklevel=2,
            )


settings = Settings()


def load_config() -> Settings:
    return Settings()