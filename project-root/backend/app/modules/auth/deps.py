# app/modules/auth/deps.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.session import SessionStore
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.auth.repository import UserRepository
from app.modules.auth.schemas import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Try Redis session first
    session_id = request.cookies.get("session_id")
    if session_id:
        session = SessionStore.get_session(session_id)
        if session:
            SessionStore.refresh_session(session_id)
            repo = UserRepository(db)
            user = await repo.get_by_id(int(session["user_id"]))
            if user:
                return user

    # Fallback to JWT token
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "access":
            raise credentials_exception
        token_data = TokenPayload(sub=user_id)
    except JWTError:
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.get_by_id(int(token_data.sub))
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user = Depends(get_current_user),
):
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
    return current_user


def require_role(*roles: str):
    """Dependency factory that checks user role."""
    async def checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.is_superuser:
            return current_user
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role: one of {roles}, got {current_user.role}"
            )
        return current_user
    return checker


def require_manager_or_above():
    """Dependency factory for manager-level access."""
    from app.core.enums import UserRole, UserRoleGroup
    return require_role(*[r.value for r in UserRoleGroup.MANAGERS])


def require_executive():
    """Dependency factory for executive-level access (director, deputy, admin)."""
    from app.core.enums import UserRole, UserRoleGroup
    return require_role(*[r.value for r in UserRoleGroup.EXECUTIVES])
