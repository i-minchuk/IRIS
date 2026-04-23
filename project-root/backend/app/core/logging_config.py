"""Logging configuration for DokPotok IRIS."""

import logging
import sys
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime

from app.core.config import settings


def setup_logging():
    """Настроить логирование."""
    
    # Папка для логов
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Формат логов
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"
    
    # Базовая конфигурация
    logging.basicConfig(
        level=getattr(logging, settings.IRIS_LOG_LEVEL, logging.INFO),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
    )
    
    # Файловый логгер для application.log
    app_log_file = log_dir / f"app_{datetime.now().strftime('%Y%m')}.log"
    
    file_handler = RotatingFileHandler(
        app_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter(log_format))
    file_handler.setLevel(logging.INFO)
    
    # Логгер для ошибок
    error_log_file = log_dir / f"error_{datetime.now().strftime('%Y%m')}.log"
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=10,
        encoding="utf-8",
    )
    error_handler.setFormatter(logging.Formatter(log_format))
    error_handler.setLevel(logging.ERROR)
    
    # Добавить обработчики к корневому логгеру
    root_logger = logging.getLogger()
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    
    # Логгер для приложения
    logger = logging.getLogger("dokpotok")
    logger.info("Application logging initialized")
    
    return logger


# Глобальный логгер
logger = logging.getLogger("dokpotok")
