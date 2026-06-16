"""Variables API router."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.variables.models import Variable, VariableRevision
from app.modules.variables.schemas import (
    VariableCreate,
    VariableUpdate,
    VariableSubstitute,
    VariableListItem,
    VariableResponse,
    VariableSubstituteResponse,
    PaginatedVariableList,
)

router = APIRouter(tags=["variables"])


@router.get("", response_model=PaginatedVariableList)
async def list_variables(
    scope: Optional[str] = None,
    project_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Count query
    count_query = select(func.count(Variable.id))
    if scope:
        count_query = count_query.where(Variable.scope == scope)
    if project_id:
        count_query = count_query.where(Variable.project_id == project_id)
    total = await db.scalar(count_query) or 0

    # Data query
    query = select(Variable)
    if scope:
        query = query.where(Variable.scope == scope)
    if project_id:
        query = query.where(Variable.project_id == project_id)
    offset = (page - 1) * page_size
    query = query.order_by(Variable.key).offset(offset).limit(page_size)
    result = await db.execute(query)
    vars = result.scalars().all()

    items = [
        VariableListItem(
            id=v.id,
            scope=v.scope,
            project_id=v.project_id,
            document_id=v.document_id,
            key=v.key,
            value=v.value,
            default_value=v.default_value,
            is_computed=v.is_computed,
        )
        for v in vars
    ]
    pages = (total + page_size - 1) // page_size
    return PaginatedVariableList(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("", response_model=VariableResponse)
async def create_variable(
    data: VariableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    var = Variable(
        scope=data.scope,
        project_id=data.project_id,
        document_id=data.document_id,
        key=data.key,
        value=data.value,
        default_value=data.default_value,
        description=data.description,
        validation_rule=data.validation_rule,
        is_computed=data.is_computed,
        computed_expression=data.computed_expression,
    )
    db.add(var)
    await db.commit()
    await db.refresh(var)
    return VariableResponse(id=var.id, key=var.key, value=var.value, scope=var.scope)


@router.patch("/{variable_id}", response_model=VariableResponse)
async def update_variable(
    variable_id: int,
    data: VariableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Variable).where(Variable.id == variable_id))
    var = result.scalar_one_or_none()
    if not var:
        raise HTTPException(status_code=404, detail="Variable not found")
    old_value = var.value
    if data.value is not None:
        var.value = data.value
    await db.commit()

    # Create revision record
    if old_value != var.value:
        rev = VariableRevision(
            variable_id=var.id,
            from_value=old_value,
            to_value=var.value,
            reason=data.reason,
            triggered_by=data.triggered_by,
            created_by_id=current_user.id,
        )
        db.add(rev)
        await db.commit()

    return VariableResponse(id=var.id, key=var.key, value=var.value, scope=var.scope)


@router.post("/{variable_id}/substitute", response_model=VariableSubstituteResponse)
async def substitute_variable(
    variable_id: int,
    data: VariableSubstitute,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Substitute variable value into document content template."""
    result = await db.execute(select(Variable).where(Variable.id == variable_id))
    var = result.scalar_one_or_none()
    if not var:
        raise HTTPException(status_code=404, detail="Variable not found")
    template = data.template
    value = var.value or var.default_value or f"{{{{{var.key}}}}}"
    substituted = template.replace(f"{{{{{var.key}}}}}", str(value))
    return VariableSubstituteResponse(
        original=template,
        substituted=substituted,
        variable=var.key,
    )
