"""API карточек сотрудников: просмотр профилей и их заполнение (upsert)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user, is_admin
from app.modules.auth.models import User
from app.modules.employees.models import EmployeeProfile
from app.modules.employees.schemas import (
    EmployeeDirectoryItem,
    EmployeeProfileSchema,
    EmployeeProfileUpsert,
)

router = APIRouter(tags=["employees"])


@router.get("/directory", response_model=list[EmployeeDirectoryItem])
async def directory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Справочник контактов: все активные пользователи с карточками сотрудников.

    Доступен любому авторизованному пользователю (только чтение).
    """
    users = list(
        (await db.execute(select(User).where(User.is_active.is_(True)))).scalars().all()
    )
    profiles = list(
        (await db.execute(select(EmployeeProfile))).scalars().all()
    )
    by_user = {p.user_id: p for p in profiles}
    items = []
    for u in users:
        p = by_user.get(u.id)
        items.append(
            EmployeeDirectoryItem(
                user_id=u.id,
                full_name=u.full_name or u.username or u.email,
                email=u.email,
                role=u.role,
                position=p.position if p else None,
                department=p.department if p else None,
                phone=p.phone if p else None,
            )
        )
    return items


@router.get("", response_model=list[EmployeeProfileSchema])
async def list_profiles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список всех карточек сотрудников."""
    result = await db.execute(select(EmployeeProfile).order_by(EmployeeProfile.id))
    return list(result.scalars().all())


@router.get("/{user_id}", response_model=EmployeeProfileSchema)
async def get_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Карточка сотрудника по id пользователя."""
    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Карточка сотрудника не найдена")
    return profile


@router.put("/{user_id}", response_model=EmployeeProfileSchema)
async def upsert_profile(
    user_id: int,
    data: EmployeeProfileUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Создание или обновление карточки сотрудника (только для администраторов)."""
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    result = await db.execute(
        select(EmployeeProfile).where(EmployeeProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    payload = data.model_dump(exclude_unset=True)
    if profile:
        for field, value in payload.items():
            setattr(profile, field, value)
    else:
        profile = EmployeeProfile(user_id=user_id, **payload)
        db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile
