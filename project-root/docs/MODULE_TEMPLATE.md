# Шаблон нового модуля DokPotok IRIS

## Создание модуля

```bash
# 1. Создать директорию
mkdir -p backend/app/modules/{module_name}

# 2. Создать базовую структуру
touch backend/app/modules/{module_name}/__init__.py
```

## Базовая структура модуля

### `__init__.py`
```python
"""{module_name} module - {description}."""

from app.modules.{module_name}.router import router
from app.modules.{module_name}.models import {ModelName}
from app.modules.{module_name}.schemas import {SchemaName}

__all__ = [
    "router",
    "{ModelName}",
    "{SchemaName}",
]
```

### `models.py`
```python
"""{module_name} models."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class {ModelName}(Base):
    """{Description} model."""
    
    __tablename__ = "{table_name}"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    # creator = relationship("User", back_populates="created_{table_name}")
```

### `schemas.py`
```python
"""{module_name} schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


# Base schema
class {SchemaName}Base(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


# Create schema
class {SchemaName}Create({SchemaName}Base):
    """Schema for creating {table_name}."""
    pass


# Update schema
class {SchemaName}Update({SchemaName}Base):
    """Schema for updating {table_name}."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)


# Response schema
class {SchemaName}Response({SchemaName}Base):
    """Schema for {table_name} response."""
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

### `repository.py`
```python
"""{module_name} repository."""

from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.{module_name}.models import {ModelName}
from app.modules.{module_name}.schemas import {SchemaName}Create, {SchemaName}Update


class {ModelName}Repository:
    """Repository for {table_name} operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, id: int) -> Optional[{ModelName}]:
        """Get {table_name} by ID."""
        result = await self.db.execute(
            select({ModelName}).where({ModelName}.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self) -> List[{ModelName}]:
        """Get all {table_name}s."""
        result = await self.db.execute(select({ModelName}))
        return result.scalars().all()
    
    async def create(self, data: {SchemaName}Create) -> {ModelName}:
        """Create new {table_name}."""
        db_obj = {ModelName}(**data.model_dump())
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def update(
        self, 
        id: int, 
        data: {SchemaName}Update
    ) -> Optional[{ModelName}]:
        """Update {table_name}."""
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def delete(self, id: int) -> bool:
        """Delete {table_name}."""
        db_obj = await self.get_by_id(id)
        if not db_obj:
            return False
        
        await self.db.delete(db_obj)
        await self.db.commit()
        return True
```

### `service.py`
```python
"""{module_name} service."""

from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.{module_name}.models import {ModelName}
from app.modules.{module_name}.schemas import {SchemaName}Create, {SchemaName}Update
from app.modules.{module_name}.repository import {ModelName}Repository


class {ModelName.replace(' ', '')}Service:
    """Service for {table_name} business logic."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = {ModelName}Repository(db)
    
    async def get_by_id(self, id: int) -> Optional[{ModelName}]:
        """Get {table_name} by ID with business logic."""
        # Add business logic here if needed
        return await self.repo.get_by_id(id)
    
    async def get_all(self) -> List[{ModelName}]:
        """Get all {table_name}s with business logic."""
        # Add business logic here if needed
        return await self.repo.get_all()
    
    async def create(self, data: {SchemaName}Create) -> {ModelName}:
        """Create {table_name} with business logic."""
        # Add business logic here if needed
        # Example: validate data, check permissions, etc.
        return await self.repo.create(data)
    
    async def update(
        self, 
        id: int, 
        data: {SchemaName}Update
    ) -> Optional[{ModelName}]:
        """Update {table_name} with business logic."""
        # Add business logic here if needed
        # Example: check permissions, validate changes, etc.
        return await self.repo.update(id, data)
    
    async def delete(self, id: int) -> bool:
        """Delete {table_name} with business logic."""
        # Add business logic here if needed
        # Example: check permissions, cascade delete, etc.
        return await self.repo.delete(id)
```

### `router.py`
```python
"""{module_name} router."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.{module_name}.models import {ModelName}
from app.modules.{module_name}.schemas import {SchemaName}Create, {SchemaName}Update, {SchemaName}Response
from app.modules.{module_name}.service import {ModelName.replace(' ', '')}Service

router = APIRouter(tags=["{module_name}"])


@router.get("/", response_model=List[{SchemaName}Response])
async def list_{table_name}(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """List all {table_name}s."""
    service = {ModelName.replace(' ', '')}Service(db)
    return await service.get_all()


@router.get("/{id}", response_model={SchemaName}Response)
async def get_{table_name}(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """Get {table_name} by ID."""
    service = {ModelName.replace(' ', '')}Service(db)
    item = await service.get_by_id(id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{table_name.title()} not found"
        )
    return item


@router.post("/", response_model={SchemaName}Response, status_code=status.HTTP_201_CREATED)
async def create_{table_name}(
    item_in: {SchemaName}Create,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """Create new {table_name}."""
    service = {ModelName.replace(' ', '')}Service(db)
    return await service.create(item_in)


@router.put("/{id}", response_model={SchemaName}Response)
async def update_{table_name}(
    id: int,
    item_in: {SchemaName}Update,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """Update {table_name}."""
    service = {ModelName.replace(' ', '')}Service(db)
    item = await service.update(id, item_in)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{table_name.title()} not found"
        )
    return item


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_{table_name}(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user),
):
    """Delete {table_name}."""
    service = {ModelName.replace(' ', '')}Service(db)
    success = await service.delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{table_name.title()} not found"
        )
```

### `deps.py`
```python
"""{module_name} dependencies."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.modules.{module_name}.service import {ModelName.replace(' ', '')}Service


async def get_{module_name}_service(
    db: AsyncSession = Depends(get_db)
) -> {ModelName.replace(' ', '')}Service:
    """Get {module_name} service instance."""
    return {ModelName.replace(' ', '')}Service(db)
```

### `router.py`
```python
"""{module_name} router."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.modules.{module_name}.schemas import {SchemaName}Create, {SchemaName}Update, {SchemaName}Response
from app.modules.{module_name}.service import {ModelName.replace(' ', '')}Service
from app.modules.{module_name}.deps import get_{module_name}_service

router = APIRouter(tags=["{module_name}"])


@router.get("/", response_model=List[{SchemaName}Response])
async def list_{table_name}(
    service: {ModelName.replace(' ', '')}Service = Depends(get_{module_name}_service),
):
    """List all {table_name}s."""
    return await service.get_all()


@router.get("/{id}", response_model={SchemaName}Response)
async def get_{table_name}(
    id: int,
    service: {ModelName.replace(' ', '')}Service = Depends(get_{module_name}_service),
):
    """Get {table_name} by ID."""
    item = await service.get_by_id(id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{table_name.title()} not found"
        )
    return item


@router.post("/", response_model={SchemaName}Response, status_code=status.HTTP_201_CREATED)
async def create_{table_name}(
    item_in: {SchemaName}Create,
    service: {ModelName.replace(' ', '')}Service = Depends(get_{module_name}_service),
):
    """Create new {table_name}."""
    return await service.create(item_in)


@router.put("/{id}", response_model={SchemaName}Response)
async def update_{table_name}(
    id: int,
    item_in: {SchemaName}Update,
    service: {ModelName.replace(' ', '')}Service = Depends(get_{module_name}_service),
):
    """Update {table_name}."""
    item = await service.update(id, item_in)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{table_name.title()} not found"
        )
    return item


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_{table_name}(
    id: int,
    service: {ModelName.replace(' ', '')}Service = Depends(get_{module_name}_service),
):
    """Delete {table_name}."""
    success = await service.delete(id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="{table_name.title()} not found"
        )
```

## Проверка

```bash
# 1. Проверить линтер
python -m ruff check backend/app/modules/{module_name}/

# 2. Проверить форматирование
python -m black --check backend/app/modules/{module_name}/

# 3. Запустить тесты
pytest tests/modules/{module_name}/ -v
```

## Регистрация в main.py

```python
# backend/app/main.py
from app.modules.{module_name} import router as {module_name}_router

app.include_router({module_name}_router, prefix=f"{settings.API_V1_STR}/{module_name}", tags=["{module_name}"])
```

---

**Версия шаблона**: 1.0  
**Дата**: 2024
