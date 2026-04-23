from __future__ import annotations

from pathlib import Path
import warnings
import secrets

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


def is_secure_secret_key(secret_key: str) -> bool:
    """Проверка SECRET_KEY на безопасность для production."""
    if not secret_key:
        return False
    
    # Минимальная длина 32 символа
    if len(secret_key) < 32:
        return False
    
    # Не должен быть дефолтным
    default_keys = [
        "your-super-secret-key-change-in-production-please",
        "change-me-in-production-min-32-chars-long",
        "secret",
        "password",
        "12345678901234567890123456789012",
    ]

    if secret_key in default_keys:
        return False
    
    # Должен содержать хотя бы буквы и цифры
    has_letters = any(c.isalpha() for c in secret_key)
    has_digits = any(c.isdigit() for c in secret_key)
    
    return has_letters and has_digits


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(BASE_DIR / ".env", BASE_DIR / ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    PROJECT_NAME: str = "ДокПоток IRIS"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:Qwerty852@localhost:5432/iris"
    )

    SECRET_KEY: str = Field(
        default="your-super-secret-key-change-in-production-please"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    IRIS_LOG_LEVEL: str = "INFO"
    IRIS_STORAGE_ROOT: str = "/app/storage"

    # Debug mode
    DEBUG: bool = False

    # Redis (для кэширования)
    REDIS_URL: str = "redis://localhost:6379"

    # Database connection pool
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600

    # AI настройки
    OPENAI_API_KEY: str
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    LLM_MODEL: str = "gpt-4o"
    EMBEDDING_MODEL: str = "text-embedding-3-large"
    
    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "docpotok_mvp"
    
    # Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_CONTEXT_TOKENS: int = 8000

    def model_post_init(self, __context) -> None:
        # Проверка SECRET_KEY на безопасность
        if not is_secure_secret_key(self.SECRET_KEY):
            warnings.warn(
                "CRITICAL: SECRET_KEY is not secure for production! "
                "Generate a secure key with: python -c \"import secrets; print(secrets.token_urlsafe(32))\" "
                "and set it via SECRET_KEY environment variable.",
                UserWarning,
                stacklevel=2,
            )

        # Проверка CORS origins для production
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