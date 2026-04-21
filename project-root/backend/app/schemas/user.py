# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

# Базовые свойства
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

# Свойства при создании (то, что приходит от клиента)
class UserCreate(UserBase):
    password: str

# Свойства при обновлении
class UserUpdate(UserBase):
    password: Optional[str] = None
    is_active: Optional[bool] = None
    is_superuser: Optional[bool] = None

# Свойства, хранящиеся в БД (включают хэш пароля)
class UserInDB(UserBase):
    id: int
    hashed_password: str
    is_active: bool
    is_superuser: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Свойства, возвращаемые клиенту (без пароля)
class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Схема для токена
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None