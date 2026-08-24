"""Переключение режимов работы приложения (demo / prod).

Режим выбирается переменной окружения MODE=demo|prod (дефолт: prod —
безопасный, не сидит демо-данные). Параметры режима читаются из
config/config.<mode>.yaml и валидируются при первом обращении.
Невалидный MODE или битый YAML → понятная ошибка при старте.
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

import yaml
from fastapi import HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parents[2]
CONFIG_DIR = BASE_DIR / "config"

VALID_MODES = ("demo", "prod")


class LoggingConfig(BaseModel):
    level: str = "INFO"
    to_file: bool = True
    dir: str = "logs"


class FeaturesConfig(BaseModel):
    demo_data_seed: bool = False
    exports: bool = True
    external_integrations: bool = True
    feedback_button: bool = True
    demo_banner: bool = False


class MetricsConfig(BaseModel):
    enabled: bool = True
    endpoint: str = "/metrics"


class ModeConfig(BaseModel):
    """Валидированная конфигурация режима из config.<mode>.yaml."""

    mode: Literal["demo", "prod"]
    debug: bool = False
    logging: LoggingConfig = Field(default_factory=LoggingConfig)
    features: FeaturesConfig = Field(default_factory=FeaturesConfig)
    metrics: MetricsConfig = Field(default_factory=MetricsConfig)


def get_mode() -> str:
    """Текущий режим из переменной окружения MODE (дефолт: prod)."""
    mode = os.getenv("MODE", "prod").strip().lower()
    if mode not in VALID_MODES:
        raise RuntimeError(
            f"Недопустимое значение MODE={mode!r}. Допустимо: {VALID_MODES}."
        )
    return mode


@lru_cache
def get_mode_config() -> ModeConfig:
    """Загрузить и провалидировать config/config.<MODE>.yaml (кэшируется)."""
    mode = get_mode()
    path = CONFIG_DIR / f"config.{mode}.yaml"
    if not path.exists():
        raise RuntimeError(f"Не найден конфигурационный файл режима: {path}")
    try:
        raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except yaml.YAMLError as exc:
        raise RuntimeError(f"Ошибка разбора {path}: {exc}") from exc
    config = ModeConfig.model_validate(raw)
    if config.mode != mode:
        raise RuntimeError(
            f"Несоответствие: MODE={mode}, а в {path.name} указан mode={config.mode!r}."
        )
    return config


def is_demo() -> bool:
    return get_mode_config().mode == "demo"


def is_prod() -> bool:
    return get_mode_config().mode == "prod"


async def require_full_mode() -> None:
    """FastAPI-зависимость: 403 для чувствительных функций в демо-режиме."""
    if is_demo():
        raise HTTPException(
            status_code=403,
            detail="Функция недоступна в демо-режиме",
        )


async def require_integrations() -> None:
    """FastAPI-зависимость: 403 для внешних интеграций, если они отключены."""
    if not get_mode_config().features.external_integrations:
        raise HTTPException(
            status_code=403,
            detail="Внешние интеграции отключены в этом режиме",
        )
