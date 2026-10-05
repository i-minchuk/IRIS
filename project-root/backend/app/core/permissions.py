# app/core/permissions.py
"""Центральная матрица прав доступа по ролям.

Источник истины — docs/RBAC.md. Правило приоритета: администратор
(роль `admin` или флаг `is_superuser`) имеет полный доступ ко всему
функционалу системы без ограничений.
"""
from typing import FrozenSet

from fastapi import Depends, HTTPException, status

from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User

FULL_ACCESS = "*"

# Минимальный набор для неизвестной/устаревшей роли
MINIMAL_PERMISSIONS: FrozenSet[str] = frozenset({
    "dashboard.read",
    "documents.read",
    "tasks.read",
    "remarks.read",
    "time_tracking.read",
    "time_tracking.write",
    "achievements.read",
    "calendar.read",
})

ROLE_PERMISSIONS: dict[str, FrozenSet[str]] = {
    "admin": frozenset({FULL_ACCESS}),
    "director": frozenset({
        "dashboard.read", "analytics.read",
        "tenders.read", "finance.read",
        "srm.read", "logistics.read",
        "projects.read", "projects.write",
        "documents.read",
        "workflow.read",
        "remarks.read", "tasks.read",
        "production.read",
        "time_tracking.read",
        "reports.read", "reports.write",
        "references.read", "archive.read",
        "achievements.read", "calendar.read", "ai.read",
    }),
    "gip": frozenset({
        "dashboard.read", "analytics.read",
        "tenders.read",
        "srm.read",
        "projects.read", "projects.write",
        "documents.read", "documents.write",
        "workflow.read", "workflow.run", "workflow.approve",
        "remarks.read", "remarks.write",
        "tasks.read", "tasks.write",
        "production.read",
        "time_tracking.read",
        "reports.read",
        "references.read", "references.write", "archive.read",
        "achievements.read", "calendar.read", "ai.read",
    }),
    "doc_controller": frozenset({
        "dashboard.read", "analytics.read",
        "projects.read",
        "documents.read", "documents.write",
        "workflow.read", "workflow.run",
        "remarks.read", "remarks.write",
        "tasks.read",
        "time_tracking.read",
        "reports.read",
        "references.read", "references.write",
        "archive.read", "archive.write",
        "achievements.read", "calendar.read", "ai.read",
    }),
    "engineer": frozenset({
        "dashboard.read", "analytics.read",
        "projects.read",
        "documents.read", "documents.write",
        "workflow.read", "workflow.approve",
        "remarks.read", "remarks.write",
        "tasks.read", "tasks.write",
        "time_tracking.read", "time_tracking.write",
        "references.read", "archive.read",
        "achievements.read", "calendar.read", "ai.read",
    }),
    "designer": frozenset({
        "dashboard.read",
        "projects.read",
        "documents.read", "documents.write",
        "workflow.read", "workflow.approve",
        "remarks.read", "remarks.write",
        "tasks.read", "tasks.write",
        "time_tracking.read", "time_tracking.write",
        "references.read", "archive.read",
        "achievements.read", "calendar.read", "ai.read",
    }),
    "pto": frozenset({
        "dashboard.read", "analytics.read",
        "srm.read",
        "projects.read",
        "documents.read", "documents.write",
        "workflow.read",
        "remarks.read", "remarks.write",
        "tasks.read", "tasks.write",
        "production.read", "production.write",
        "time_tracking.read", "time_tracking.write",
        "reports.read",
        "references.read", "archive.read",
        "achievements.read", "calendar.read", "ai.read",
    }),
    "mto": frozenset({
        "dashboard.read", "analytics.read",
        "tenders.read", "finance.read",
        "srm.read", "srm.write",
        "logistics.read",
        "projects.read",
        "documents.read",
        "time_tracking.read", "time_tracking.write",
        "reports.read",
        "references.read",
        "achievements.read", "calendar.read",
    }),
    "logistics": frozenset({
        "dashboard.read", "analytics.read",
        "srm.read",
        "logistics.read", "logistics.write",
        "tasks.read",
        "time_tracking.read", "time_tracking.write",
        "reports.read",
        "achievements.read", "calendar.read",
    }),
    "storekeeper": frozenset({
        "dashboard.read",
        "srm.read", "srm.write",
        "documents.read",
        "tasks.read",
        "time_tracking.read", "time_tracking.write",
        "achievements.read", "calendar.read",
    }),
    "installer": frozenset({
        "dashboard.read",
        "documents.read",
        "workflow.read",
        "remarks.read", "remarks.write",
        "tasks.read", "tasks.write",
        "time_tracking.read", "time_tracking.write",
        "achievements.read", "calendar.read",
    }),
}

# Обратная совместимость: устаревшие роли, которым раньше был открыт
# весь функционал, переводим на максимально близкий современный набор.
LEGACY_ROLE_MAP: dict[str, str] = {
    "deputy_director": "director",
    "department_head": "gip",
    "site_manager": "pto",
    "manager": "mto",
    "norm_controller": "designer",
}


def get_permissions(user: User) -> FrozenSet[str]:
    """Эффективный набор разрешений пользователя."""
    if user.is_superuser or user.role == "admin":
        return frozenset({FULL_ACCESS})
    role = LEGACY_ROLE_MAP.get(user.role, user.role)
    return ROLE_PERMISSIONS.get(role, MINIMAL_PERMISSIONS)


def has_permission(user: User, permission: str) -> bool:
    perms = get_permissions(user)
    return FULL_ACCESS in perms or permission in perms


def require_permission(permission: str):
    """Dependency factory: проверяет разрешение на весь роутер/эндпоинт.

    Администратор (admin/superuser) проходит всегда.
    """
    async def checker(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав доступа для этого раздела",
            )
        return current_user

    return checker
