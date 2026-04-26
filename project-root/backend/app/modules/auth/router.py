# app/modules/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.core import security
from app.core.config import settings
from app.core.security_utils import limiter
from app.db.session import get_db
from app.modules.auth.schemas import User, UserCreate, Token, LoginRequest, RefreshTokenRequest
from app.modules.auth.repository import UserRepository
from app.modules.auth.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=User)
async def register(
    *,
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


@router.post("/logout")
async def logout(response: Response = None):
    """Выйти из системы и очистить cookies."""
    from app.modules.auth.cookies import clear_auth_cookies
    clear_auth_cookies(response)
    return {"detail": "Successfully logged out"}
