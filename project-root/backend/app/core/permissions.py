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
        "srm.directories.write", "srm.requests.write",
        "srm.contracts.write", "srm.orders.write", "srm.invoices.write",
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
        "srm.orders.write",
        "logistics.read", "logistics.write",
        "tasks.read",
        "time_tracking.read", "time_tracking.write",
        "reports.read",
        "achievements.read", "calendar.read",
    }),
    "storekeeper": frozenset({
        "dashboard.read",
        "srm.read", "srm.write",
        "srm.receipt.write",
        "documents.read",
        "tasks.read",
        "time_tracking.read", "time_tracking.write",
        "achievements.read", "calendar.read",
    }),
    "installer": frozenset({
        "dashboard.read",
        "documents.read", "documents.scoped",
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


# ---------- Финансовые поля (скрытие для ролей без finance.read) ----------

FINANCE_FIELD_NAMES: FrozenSet[str] = frozenset({
    "nmc",            # тендеры: НМЦ
    "our_price",      # тендеры: наша цена
    "margin_pct",     # тендеры: маржа
    "calculated_cost",# тендеры: расчётная стоимость
    "active_sum",     # сводка портфеля
    "won_sum",        # сводка портфеля
    "sum_nmc",        # воронка по стадиям
    "amount",         # SRM: суммы заявок/заказов/контрактов/счетов
})


def strip_finance_fields(payload):
    """Рекурсивно обнуляет финансовые поля в dict/list."""
    if isinstance(payload, dict):
        return {
            key: (None if key in FINANCE_FIELD_NAMES else strip_finance_fields(value))
            for key, value in payload.items()
        }
    if isinstance(payload, list):
        return [strip_finance_fields(item) for item in payload]
    return payload


def redact_finance(payload, response_model, user: User):
    """Скрывает финансовые поля в ответе для ролей без finance.read.

    Принимает объект или список объектов (ORM/модель), возвращает
    экземпляр(ы) response_model с обнулёнными финансовыми полями.
    """
    if has_permission(user, "finance.read"):
        return payload
    single = not isinstance(payload, list)
    items = [payload] if single else list(payload)
    redacted = [
        response_model(**strip_finance_fields(response_model.model_validate(item).model_dump()))
        for item in items
    ]
    return redacted[0] if single else redacted


# ---------- Объектный уровень (этап 3) ----------

def needs_document_scope(user: User) -> bool:
    """Роли с объектным ограничением: видят документы только своей привязки.

    Документ «свой», если пользователь — автор, проверяющий, утверждающий
    или назначен исполнителем (assignee_ids). Администратор не ограничивается.
    """
    if user.is_superuser or user.role == "admin":
        return False
    return has_permission(user, "documents.scoped")


# Статусы заказа, которые относятся к приёмке на складе/объекте.
# Кладовщик (srm.receipt.write) может переводить заказ только в эти статусы,
# не изменяя остальных полей.
RECEIPT_STATUSES: FrozenSet[str] = frozenset({
    "delivered", "inspection", "accepted", "rejected",
})


def can_write_receipt(user: User, update_fields: set) -> bool:
    """Кладовщик может менять только статус приёмки, остальные поля — нет."""
    if has_permission(user, "srm.orders.write"):
        return True
    if not has_permission(user, "srm.receipt.write"):
        return False
    touched = {f for f in update_fields if f != "status"}
    return not touched
