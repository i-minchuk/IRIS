# app/modules/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from app.core import security
from app.core.config import settings
from app.core.security_utils import limiter
from app.db.session import get_db
from app.modules.auth.schemas import (
    User, UserCreate, UserUpdate, Token, LoginRequest, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse,
)
from app.modules.auth.repository import UserRepository
from app.modules.auth.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=User)
@limiter.limit("5/minute")
async def register(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user_in: UserCreate,
):
    """Регистрация нового пользователя."""
    repo = UserRepository(db)
    user = await repo.get_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    user = await repo.create(user_in=user_in)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login_json(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    response: Response = None,
    login_data: LoginRequest,
):
    """JSON-based вход. Возвращает access + refresh токены.
    
    По умолчанию устанавливает HttpOnly cookies.
    Для JSON response используйте query параметр ?response_type=json
    """
    repo = UserRepository(db)
    
    # Проверяем вход по email или username
    if login_data.email:
        user = await repo.get_by_email(email=login_data.email)
    else:
        user = await repo.get_by_username(username=login_data.username)
    
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    # Проверка: использовать cookies или JSON response
    response_type = request.query_params.get("response_type")
    
    if response_type == "json":
        # Возвращаем токены в body (для совместимости)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    else:
        # Устанавливаем HttpOnly cookies (рекомендуется для production)
        from app.modules.auth.cookies import set_auth_cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/login/oauth2", response_model=Token)
@limiter.limit("5/minute")
async def login_oauth2(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    response: Response = None,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    """OAuth2 совместимый вход (для Swagger UI).
    
    По умолчанию устанавливает HttpOnly cookies.
    Для JSON response используйте query параметр ?response_type=json
    """
    repo = UserRepository(db)
    user = await repo.get_by_email(email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    # Проверка: использовать cookies или JSON response
    response_type = request.query_params.get("response_type")
    
    if response_type == "json":
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    else:
        from app.modules.auth.cookies import set_auth_cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
@limiter.limit("10/minute")
async def refresh_token(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    response: Response = None,
    token_data: RefreshTokenRequest,
):
    """Обновление access token по refresh token.
    
    По умолчанию устанавливает новые HttpOnly cookies.
    Для JSON response используйте query параметр ?response_type=json
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token_data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    repo = UserRepository(db)
    user = await repo.get_by_id(int(user_id))
    if user is None:
        raise credentials_exception

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    new_refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    # Проверка: использовать cookies или JSON response
    response_type = request.query_params.get("response_type")
    
    if response_type == "json":
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    else:
        from app.modules.auth.cookies import set_auth_cookies
        set_auth_cookies(response, access_token, new_refresh_token)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Получить данные текущего пользователя."""
    return current_user


@router.get("/users", response_model=list[User])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Список всех пользователей (только для админов)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    repo = UserRepository(db)
    users = await repo.get_all()
    return users


@router.patch("/users/{user_id}", response_model=User)
async def update_user(
    user_id: int,
    updates: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Обновить пользователя (только для админов)."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    update_data = updates.model_dump(exclude_unset=True)
    if "password" in update_data:
        from app.core.security import get_password_hash
        update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
    await repo.update(user, **update_data)
    return user


@router.post("/logout")
async def logout(response: Response = None):
    """Выйти из системы и очистить cookies."""
    from app.modules.auth.cookies import clear_auth_cookies
    clear_auth_cookies(response)
    return {"detail": "Successfully logged out"}


@router.post("/forgot-password", response_model=PasswordResetResponse)
@limiter.limit("5/minute")
async def forgot_password(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    data: ForgotPasswordRequest,
):
    """Запрос на сброс пароля. В демо-режиме возвращает токен в ответе."""
    repo = UserRepository(db)
    user = await repo.get_by_email(email=data.email)
    if not user:
        # Не раскрываем, существует ли email
        return PasswordResetResponse(message="If the email exists, a reset link has been sent")

    reset_token = security.create_reset_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=30),
    )

    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    await db.commit()

    # TODO: отправить email с токеном через SMTP
    # В демо-режиме возвращаем токен в ответе для удобства тестирования
    return PasswordResetResponse(
        message="Password reset token generated (demo mode: check response)",
        reset_token=reset_token,
    )


@router.post("/reset-password", response_model=dict)
@limiter.limit("5/minute")
async def reset_password(
    *,
    request: Request,
    db: AsyncSession = Depends(get_db),
    data: ResetPasswordRequest,
):
    """Сброс пароля по токену."""
    payload = security.verify_reset_token(data.token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user_id = int(payload.get("sub", 0))
    repo = UserRepository(db)
    user = await repo.get_by_id(user_id)
    if not user or user.reset_token != data.token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    # Проверяем срок действия токена
    if user.reset_token_expires and user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired",
        )

    user.hashed_password = security.get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    return {"message": "Password has been reset successfully"}
