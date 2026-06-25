from app.modules.auth.recovery_codes import (
    generate_recovery_codes, hash_recovery_codes, verify_recovery_code, consume_recovery_code
)# app/modules/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from app.core import security
from app.core.config import settings
from app.core.security_utils import limiter, rate_limit_standard, rate_limit_refresh_route
from app.db.session import get_db
from app.modules.auth.schemas import (
    User, UserResponse, UserCreate, UserUpdate, Token, LoginRequest, RefreshTokenRequest,
    ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse,
)
from app.modules.auth.repository import UserRepository
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.totp import generate_totp_secret, get_totp_uri, generate_qr_code, verify_totp
from app.core.session import SessionStore

router = APIRouter()


@router.post("/register", response_model=UserResponse)
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
    
    # Если включен 2FA — требуем TOTP token
    if user.totp_enabled:
        totp_token = request.query_params.get("totp_token")
        if not totp_token or not verify_totp(user.totp_secret, totp_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="TOTP token required or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})

    # Create Redis session
    user_data = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
    }
    session_id = SessionStore.create_session(user.id, user_data)

    # Проверка: использовать cookies или JSON response
    response_type = request.query_params.get("response_type")

    if response_type == "json":
        # Возвращаем токены в body (для совместимости)
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    else:
        # Устанавливаем HttpOnly cookies (рекомендуется для production)
        from app.modules.auth.cookies import set_auth_cookies
        set_auth_cookies(response, access_token, refresh_token)
        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=SessionStore.EXPIRE_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=True,
            samesite="lax",
            path="/",
        )

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

    # Если включен 2FA — требуем TOTP token
    if user.totp_enabled:
        totp_token = request.query_params.get("totp_token")
        if not totp_token or not verify_totp(user.totp_secret, totp_token):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="TOTP token required or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})

    # Create Redis session
    user_data = {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
    }
    session_id = SessionStore.create_session(user.id, user_data)

    # Проверка: использовать cookies или JSON response
    response_type = request.query_params.get("response_type")

    if response_type == "json":
        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}
    else:
        from app.modules.auth.cookies import set_auth_cookies
        set_auth_cookies(response, access_token, refresh_token)
        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=SessionStore.EXPIRE_DAYS * 24 * 60 * 60,
            httponly=True,
            secure=True,
            samesite="lax",
            path="/",
        )

        return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
@rate_limit_refresh_route()
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
        payload = jwt.decode(
            token_data.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=security.JWT_AUDIENCE,
            issuer=security.JWT_ISSUER,
        )
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


@router.get("/me", response_model=UserResponse)
@rate_limit_standard()
async def read_users_me(
    request: Request,
    current_user: User = Depends(get_current_active_user),
):
    """Получить данные текущего пользователя."""
    return current_user


@router.post("/users/me/telegram")
async def link_telegram(
    chat_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Привязать Telegram chat_id к текущему пользователю."""
    current_user.telegram_chat_id = chat_id
    await db.commit()
    return {"status": "linked"}


@router.get("/users", response_model=list[UserResponse])
@rate_limit_standard()
async def list_users(
    request: Request,
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


@router.patch("/users/{user_id}", response_model=UserResponse)
@rate_limit_standard()
async def update_user(
    request: Request,
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
async def logout(request: Request, response: Response = None):
    """Выйти из системы и очистить cookies."""
    from app.modules.auth.cookies import clear_auth_cookies
    clear_auth_cookies(response)
    session_id = request.cookies.get("session_id")
    if session_id:
        SessionStore.delete_session(session_id)
    response.delete_cookie(key="session_id", path="/")
    return {"detail": "Successfully logged out"}


@router.post("/2fa/setup")
async def setup_2fa(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Настроить 2FA: сгенерировать секрет и вернуть QR-код."""
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    current_user.totp_enabled = False  # Reset until verified
    await db.commit()
    uri = get_totp_uri(secret, current_user.email)
    qr = generate_qr_code(uri)
    return {"secret": secret, "qr_code": f"data:image/png;base64,{qr}"}


@router.post("/2fa/verify")
async def verify_2fa_setup(
    token: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Подтвердить настройку 2FA, введя TOTP token."""
    if not current_user.totp_secret:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "2FA not set up")
    if verify_totp(current_user.totp_secret, token):
        current_user.totp_enabled = True
        await db.commit()
        return {"status": "enabled"}
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid token")


@router.post("/2fa/disable")
async def disable_2fa(
    token: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Отключить 2FA, введя TOTP token."""
    if not current_user.totp_secret or not current_user.totp_enabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "2FA is not enabled")
    if verify_totp(current_user.totp_secret, token):
        current_user.totp_enabled = False
        current_user.totp_secret = None
        await db.commit()
        return {"status": "disabled"}
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid token")


@router.post("/2fa/recovery-codes")
async def generate_2fa_recovery_codes(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate recovery codes for 2FA account recovery."""
    if not current_user.totp_enabled:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "2FA is not enabled")
    
    codes = generate_recovery_codes(10)
    hashed = hash_recovery_codes(codes)
    
    # Store hashed codes in user (need to add recovery_codes field to User model)
    # For now, store in a JSON field or separate table
    # Using user metadata as temporary storage
    from app.modules.auth.models import User as UserModel
    result = await db.execute(select(UserModel).where(UserModel.id == current_user.id))
    user = result.scalar_one()
    
    # Store in a separate table or JSON field - using content as temp
    if not hasattr(user, 'recovery_codes'):
        # Create a simple storage mechanism
        import json
        from sqlalchemy import text
        await db.execute(
            text("UPDATE users SET recovery_codes = :codes WHERE id = :id"),
            {"codes": json.dumps(hashed), "id": user.id}
        )
        await db.commit()
    
    return {"codes": codes, "count": len(codes)}


@router.post("/2fa/recover")
async def recover_with_2fa_code(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Recover account access using a recovery code."""
    data = await request.json()
    email = data.get("email")
    recovery_code = data.get("recovery_code")
    
    if not email or not recovery_code:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Email and recovery code required")
    
    repo = UserRepository(db)
    user = await repo.get_by_email(email)
    if not user or not user.totp_enabled:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    
    # Check recovery codes
    import json
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT recovery_codes FROM users WHERE id = :id"),
        {"id": user.id}
    )
    row = result.scalar()
    if not row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No recovery codes available")
    
    hashed_codes = json.loads(row)
    if not verify_recovery_code(recovery_code, hashed_codes):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid recovery code")
    
    # Consume the used code
    new_codes = consume_recovery_code(recovery_code, hashed_codes)
    await db.execute(
        text("UPDATE users SET recovery_codes = :codes WHERE id = :id"),
        {"codes": json.dumps(new_codes), "id": user.id}
    )
    
    # Generate tokens (bypass 2FA for this session)
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    
    await db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "message": "Account recovered. Please re-enable 2FA in settings.",
    }


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
    return PasswordResetResponse(
        message="If the email exists, a reset link has been sent",
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


# ---------------------------------------------------------------------------
# SAML / SSO endpoints
# ---------------------------------------------------------------------------


def _create_tokens_for_user(user) -> dict:
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


async def get_or_create_user_by_email(db: AsyncSession, email: str) -> User:
    repo = UserRepository(db)
    user = await repo.get_by_email(email)
    if user:
        return user
    # Create a new user without password for SAML auth
    from app.core.security import get_password_hash
    import secrets
    db_user = User(
        email=email,
        username=email.split("@")[0],
        hashed_password=get_password_hash(secrets.token_urlsafe(32)),
        full_name=email.split("@")[0],
        is_active=True,
        is_superuser=False,
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user


@router.get("/saml/login")
async def saml_login(request: Request):
    from app.modules.auth.saml import init_saml_auth, prepare_request
    auth = init_saml_auth(prepare_request(request))
    return RedirectResponse(auth.login())


@router.post("/saml/acs")
async def saml_acs(request: Request, db: AsyncSession = Depends(get_db)):
    from app.modules.auth.saml import init_saml_auth, prepare_request
    auth = init_saml_auth(prepare_request(request))
    auth.process_response()
    if auth.is_authenticated():
        email = auth.get_nameid()
        user = await get_or_create_user_by_email(db, email)
        tokens = _create_tokens_for_user(user)
        return RedirectResponse(f"/login?token={tokens['access_token']}")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="SAML authentication failed")


@router.get("/saml/metadata")
async def saml_metadata():
    from app.modules.auth.saml import init_saml_auth
    auth = init_saml_auth({})
    return Response(auth.get_settings().get_sp_metadata(), media_type="text/xml")
