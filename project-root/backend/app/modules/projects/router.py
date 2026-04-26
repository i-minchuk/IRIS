"""Projects API router."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.projects.models import Project, Stage, Kit, Section

router = APIRouter(tags=["projects"])


@router.get("", response_model=list)
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    projects = result.scalars().all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "customer_name": p.customer_name,
            "contract_number": p.contract_number,
            "stage": p.stage,
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]


@router.post("", response_model=dict)
async def create_project(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    project = Project(
        name=data.get("name"),
        code=data.get("code"),
        customer_name=data.get("customer_name"),
        contract_number=data.get("contract_number"),
        stage=data.get("stage", "draft"),
        status=data.get("status", "draft"),
        standard_template_id=data.get("standard_template_id"),
        variables=data.get("variables", {}),
        created_by_id=current_user.id,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "status": project.status,
    }


@router.get("/{project_id}", response_model=dict)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "customer_name": project.customer_name,
        "contract_number": project.contract_number,
        "stage": project.stage,
        "status": project.status,
        "variables": project.variables,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "stages": [
            {
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "kits": [
                    {
                        "id": k.id,
                        "name": k.name,
                        "code": k.code,
                        "sections": [
                            {"id": sec.id, "name": sec.name, "code": sec.code}
                            for sec in k.sections
                        ],
                    }
                    for k in s.kits
                ],
            }
            for s in project.stages
        ],
    }


@router.post("/{project_id}/stages", response_model=dict)
async def create_stage(
    project_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stage = Stage(
        project_id=project_id,
        name=data.get("name"),
        code=data.get("code"),
        sort_order=data.get("sort_order", 0),
    )
    db.add(stage)
    await db.commit()
    await db.refresh(stage)
    return {"id": stage.id, "name": stage.name, "code": stage.code}


@router.post("/stages/{stage_id}/kits", response_model=dict)
async def create_kit(
    stage_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    kit = Kit(
        stage_id=stage_id,
        name=data.get("name"),
        code=data.get("code"),
        sort_order=data.get("sort_order", 0),
    )
    db.add(kit)
    await db.commit()
    await db.refresh(kit)
    return {"id": kit.id, "name": kit.name, "code": kit.code}


@router.post("/kits/{kit_id}/sections", response_model=dict)
async def create_section(
    kit_id: int,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    section = Section(
        kit_id=kit_id,
        name=data.get("name"),
        code=data.get("code"),
        sort_order=data.get("sort_order", 0),
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return {"id": section.id, "name": section.name, "code": section.code}


@router.get("/{project_id}/tree", response_model=dict)
async def get_project_tree(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Return full project tree: stages → kits → sections → documents."""
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.stages).selectinload(Stage.kits).selectinload(Kit.sections).selectinload(Section.documents)
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": project.id,
        "name": project.name,
        "code": project.code,
        "stages": [
            {
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "kits": [
                    {
                        "id": k.id,
                        "name": k.name,
                        "code": k.code,
                        "sections": [
                            {
                                "id": sec.id,
                                "name": sec.name,
                                "code": sec.code,
                                "documents": [
                                    {
                                        "id": d.id,
                                        "number": d.number,
                                        "name": d.name,
                                        "doc_type": d.doc_type,
                                        "status": d.status,
                                        "crs_code": d.crs_code,
                                    }
                                    for d in sec.documents
                                ],
                            }
                            for sec in k.sections
                        ],
                    }
                    for k in s.kits
                ],
            }
            for s in project.stages
        ],
    }
