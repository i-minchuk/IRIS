"""Projects API router."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.modules.auth.deps import get_current_active_user
from app.modules.auth.models import User
from app.modules.projects.models import Project, Stage, Kit, Section
from app.modules.projects.schemas import (
    ProjectCreate,
    ProjectCreateResponse,
    ProjectDetailResponse,
    StageCreate,
    StageResponse,
    KitCreate,
    KitResponse,
    SectionCreate,
    SectionResponse,
)
from app.core.cache import invalidate_cache

router = APIRouter(tags=["projects"])


@router.get("", response_model=dict)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    offset = (page - 1) * page_size
    total = await db.scalar(select(func.count()).select_from(Project))
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc()).offset(offset).limit(page_size)
    )
    projects = result.scalars().all()
    items = [
        {
            "id": p.id,
            "name": p.name,
            "code": p.code,
            "customer_name": p.customer_name,
            "contract_number": p.contract_number,
            "stage": p.stage,
            "status": p.status,
            "variables": p.variables or {},
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in projects
    ]
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@router.post("", response_model=ProjectCreateResponse)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    project = Project(
        name=data.name,
        code=data.code,
        customer_name=data.customer_name,
        contract_number=data.contract_number,
        stage=data.stage,
        status=data.status,
        standard_template_id=data.standard_template_id,
        variables=data.variables or {},
        created_by_id=current_user.id,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    await invalidate_cache("cache:*portfolio*")
    await invalidate_cache("cache:*dashboard*")
    return ProjectCreateResponse(
        id=project.id,
        name=project.name,
        code=project.code,
        status=project.status,
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        code=project.code,
        customer_name=project.customer_name,
        contract_number=project.contract_number,
        stage=project.stage,
        status=project.status,
        variables=project.variables,
        created_at=project.created_at.isoformat() if project.created_at else None,
        stages=[
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
    )


@router.post("/{project_id}/stages", response_model=StageResponse)
async def create_stage(
    project_id: int,
    data: StageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    stage = Stage(
        project_id=project_id,
        name=data.name,
        code=data.code,
        sort_order=data.sort_order,
    )
    db.add(stage)
    await db.commit()
    await db.refresh(stage)
    return StageResponse(id=stage.id, name=stage.name, code=stage.code)


@router.post("/stages/{stage_id}/kits", response_model=KitResponse)
async def create_kit(
    stage_id: int,
    data: KitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    kit = Kit(
        stage_id=stage_id,
        name=data.name,
        code=data.code,
        sort_order=data.sort_order,
    )
    db.add(kit)
    await db.commit()
    await db.refresh(kit)
    return KitResponse(id=kit.id, name=kit.name, code=kit.code)


@router.post("/kits/{kit_id}/sections", response_model=SectionResponse)
async def create_section(
    kit_id: int,
    data: SectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    section = Section(
        kit_id=kit_id,
        name=data.name,
        code=data.code,
        sort_order=data.sort_order,
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return SectionResponse(id=section.id, name=section.name, code=section.code)


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
