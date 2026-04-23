from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, Query
from app.db.session import get_db
from app.modules.documents.models import Document, DocumentDependency
from app.modules.documents.schemas import (
    DocumentDependencyCreate,
    DocumentDependencyUpdate,
    DocumentDependencyOut,
    DependencyGraphOut,
    DocumentNode,
    DependencyEdge,
)

router = APIRouter()


@router.post("/dependencies", response_model=DocumentDependencyOut)
async def create_dependency(
    data: DocumentDependencyCreate,
    session: AsyncSession = Depends(get_db),
):
    # Validate documents exist
    src = await session.get(Document, data.source_document_id)
    tgt = await session.get(Document, data.target_document_id)
    if not src or not tgt:
        raise HTTPException(404, "Source or target document not found")
    if src.project_id != tgt.project_id:
        raise HTTPException(400, "Documents must belong to the same project")
    # Prevent duplicate
    existing = await session.scalar(
        select(DocumentDependency).where(
            and_(
                DocumentDependency.source_document_id == data.source_document_id,
                DocumentDependency.target_document_id == data.target_document_id,
            )
        )
    )
    if existing:
        raise HTTPException(409, "Dependency already exists")
    dep = DocumentDependency(**data.model_dump())
    session.add(dep)
    await session.commit()
    await session.refresh(dep)
    return dep


@router.get("/dependencies", response_model=List[DocumentDependencyOut])
async def list_dependencies(
    project_id: Optional[int] = Query(None),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(DocumentDependency)
    if project_id:
        stmt = stmt.where(DocumentDependency.project_id == project_id)
    result = await session.scalars(stmt)
    return result.all()


@router.patch("/dependencies/{dep_id}", response_model=DocumentDependencyOut)
async def update_dependency(
    dep_id: int,
    data: DocumentDependencyUpdate,
    session: AsyncSession = Depends(get_db),
):
    dep = await session.get(DocumentDependency, dep_id)
    if not dep:
        raise HTTPException(404, "Dependency not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(dep, field, value)
    await session.commit()
    await session.refresh(dep)
    return dep


@router.delete("/dependencies/{dep_id}")
async def delete_dependency(
    dep_id: int,
    session: AsyncSession = Depends(get_db),
):
    dep = await session.get(DocumentDependency, dep_id)
    if not dep:
        raise HTTPException(404, "Dependency not found")
    await session.delete(dep)
    await session.commit()
    return {"ok": True}


@router.get("/dependencies/graph", response_model=DependencyGraphOut)
async def get_dependency_graph(
    project_id: int = Query(...),
    session: AsyncSession = Depends(get_db),
):
    docs_result = await session.scalars(
        select(Document).where(Document.project_id == project_id)
    )
    docs = docs_result.all()
    deps_result = await session.scalars(
        select(DocumentDependency).where(DocumentDependency.project_id == project_id)
    )
    deps = deps_result.all()

    nodes: List[DocumentNode] = []
    for d in docs:
        nodes.append(
            DocumentNode(
                id=d.id,
                number=d.number,
                name=d.name,
                doc_type=d.doc_type,
                status=d.status,
                planned_start=d.planned_start,
                planned_end=d.planned_end,
                actual_start=d.actual_start,
                actual_end=d.actual_end,
                duration_hours=d.duration_hours,
            )
        )

    edges: List[DependencyEdge] = []
    for dep in deps:
        edges.append(
            DependencyEdge(
                id=dep.id,
                source=dep.source_document_id,
                target=dep.target_document_id,
                dependency_type=dep.dependency_type,
                lag_hours=dep.lag_hours,
            )
        )

    return DependencyGraphOut(project_id=project_id, nodes=nodes, edges=edges)
