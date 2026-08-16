# app/modules/auth/schemas.py
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    username: Optional[str] = None

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v or '@' not in v:
            raise ValueError('Invalid email address')
        return v


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None


class UserMeUpdate(BaseModel):
    """Поля, которые пользователь может менять у себя сам."""
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """User response schema — safe for API responses (no hashed_password)."""
    id: int
    is_active: bool
    role: str
    telegram_chat_id: Optional[str] = None
    totp_enabled: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class User(UserBase):
    id: int
    is_active: bool
    role: str
    telegram_chat_id: Optional[str] = None
    totp_enabled: bool = False
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenWithCookies(BaseModel):
    """Token response with HttpOnly cookie support."""
    access_token: str
    refresh_token: str
    token_type: str

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIs...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                "token_type": "bearer",
            }
        }


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class LoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str

    def model_post_init(self, __context) -> None:
        """Validate that either email or username is provided."""
        if not self.email and not self.username:
            raise ValueError("Either email or username must be provided")
        if self.email and self.username:
            raise ValueError("Provide either email or username, not both")


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class PasswordResetResponse(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# API Tokens
# ---------------------------------------------------------------------------


class ApiTokenCreate(BaseModel):
    name: str


class ApiTokenResponse(BaseModel):
    id: str
    name: str
    token: str  # full token returned only on creation
    created_at: str
    model_config = ConfigDict(from_attributes=True)


class ApiTokenListItem(BaseModel):
    id: str
    name: str
    created_at: str
    last4: str
    model_config = ConfigDict(from_attributes=True)
