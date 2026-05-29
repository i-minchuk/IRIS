"""Enums for tasks and production control."""
from enum import Enum


class TaskType(str, Enum):
    """Task types for different contexts."""
    PRODUCTION = "production"      # Производственная операция
    DOCUMENT = "document"          # Работа с документом
    APPROVAL = "approval"          # Согласование/утверждение
    REVIEW = "review"              # Проверка/рецензирование
    ISSUE = "issue"                # Проблема/баг
    PLANNING = "planning"          # Планирование
    MEETING = "meeting"            # Встреча/совещание
    OTHER = "other"                # Другое


class TaskStatus(str, Enum):
    """Task statuses."""
    NEW = "new"                    # Новая
    IN_PROGRESS = "in_progress"    # В работе
    ON_HOLD = "on_hold"            # На паузе
    DONE = "done"                  # Выполнена
    CANCELLED = "cancelled"        # Отменена
    REVIEW = "review"              # На проверке
    APPROVAL = "approval"          # На согласовании


class TaskPriority(str, Enum):
    """Task priorities."""
    LOW = "low"                    # Низкий
    NORMAL = "normal"              # Средний
    HIGH = "high"                  # Высокий
    CRITICAL = "critical"          # Критический


class OperationStatus(str, Enum):
    """Operation statuses for production routes."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"


class DocumentStatus(str, Enum):
    """Document statuses."""
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"
    OVERDUE = "overdue"


class UserRole(str, Enum):
    """User roles for RBAC."""
    DIRECTOR = "director"                    # Генеральный директор
    DEPUTY_DIRECTOR = "deputy_director"      # Заместитель ГД
    DEPARTMENT_HEAD = "department_head"      # Начальник отдела
    GIP = "gip"                              # ГИП
    SITE_MANAGER = "site_manager"            # Начальник участка / Мастер
    ENGINEER = "engineer"                    # Инженер
    MANAGER = "manager"                      # Менеджер
    NORM_CONTROLLER = "norm_controller"      # Нормоконтролёр
    ADMIN = "admin"                          # Администратор


class UserRoleGroup:
    """Role groups for permission checks."""
    MANAGERS = {
        UserRole.DIRECTOR,
        UserRole.DEPUTY_DIRECTOR,
        UserRole.DEPARTMENT_HEAD,
        UserRole.GIP,
        UserRole.MANAGER,
        UserRole.ADMIN,
    }
    ENGINEERS = {
        UserRole.ENGINEER,
        UserRole.NORM_CONTROLLER,
        UserRole.GIP,
    }
    EXECUTIVES = {
        UserRole.DIRECTOR,
        UserRole.DEPUTY_DIRECTOR,
        UserRole.ADMIN,
    }
