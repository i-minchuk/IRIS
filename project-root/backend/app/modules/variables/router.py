"""Variables API router."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.variables.models import Variable, VariableRevision

router = APIRouter(tags=["variables"])


@router.get("", response_model=list)
async def list_variables(
    scope: Optional[str] = None,
    project_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = select(Variable)
    if scope:
        query = query.where(Variable.scope == scope)
    if project_id:
        query = query.where(Variable.project_id == project_id)
    result = await db.execute(query.order_by(Variable.key))
    vars = result.scalars().all()
    return [
        {
            "id": v.id,
            "scope": v.scope,
            "project_id": v.project_id,
            "document_id": v.document_id,
            "key": v.key,
            "value": v.value,
            "default_value": v.default_value,
            "is_computed": v.is_computed,
        }
        for v in vars
    ]


@router.post("", response_model=dict)
async def create_variable(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    var = Variable(
        scope=data.get("scope", "project"),
        project_id=data.get("project_id"),
        document_id=data.get("document_id"),
        key=data.get("key"),
        value=data.get("value"),
        default_value=data.get("default_value"),
        description=data.get("description"),
        validation_rule=data.get("validation_rule"),
        is_computed=data.get("is_computed", False),
        computed_expression=data.get("computed_expression"),
    )
    db.add(var)
    await db.commit()
    await db.refresh(var)
    return {"id": var.id, "key": var.key, "value": var.value, "scope": var.scope}


@router.patch("/{variable_id}", response_model=dict)
async def update_variable(
    variable_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Variable).where(Variable.id == variable_id))
    var = result.scalar_one_or_none()
    if not var:
        raise HTTPException(status_code=404, detail="Variable not found")
    old_value = var.value
    var.value = data.get("value", var.value)
    await db.commit()

    # Create revision record
    if old_value != var.value:
        rev = VariableRevision(
            variable_id=var.id,
            from_value=old_value,
            to_value=var.value,
            reason=data.get("reason"),
            triggered_by=data.get("triggered_by"),
            created_by_id=current_user.id,
        )
        db.add(rev)
        await db.commit()

    return {"id": var.id, "key": var.key, "value": var.value}


@router.post("/{variable_id}/substitute", response_model=dict)
async def substitute_variable(
    variable_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Substitute variable value into document content template."""
    result = await db.execute(select(Variable).where(Variable.id == variable_id))
    var = result.scalar_one_or_none()
    if not var:
        raise HTTPException(status_code=404, detail="Variable not found")
    template = data.get("template", "")
    value = var.value or var.default_value or f"{{{{{var.key}}}}}"
    substituted = template.replace(f"{{{{{var.key}}}}}", str(value))
    return {"original": template, "substituted": substituted, "variable": var.key}
