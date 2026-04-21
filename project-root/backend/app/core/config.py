from __future__ import annotations

from pathlib import Path
import warnings

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


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

    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    def model_post_init(self, __context) -> None:
        if self.SECRET_KEY == "your-super-secret-key-change-in-production-please":
            warnings.warn(
                "WARNING: Using default SECRET_KEY. "
                "Set SECRET_KEY environment variable in production!",
                UserWarning,
                stacklevel=2,
            )


settings = Settings()


def load_config() -> Settings:
    return Settings()