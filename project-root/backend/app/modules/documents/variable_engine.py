"""Variable engine: substitution, cascade updates, computed variables."""
import re
from datetime import datetime
from typing import Dict, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.variables.models import Variable
from app.modules.documents.models import Document


VARIABLE_PATTERN = re.compile(r"\{\{(\s*[\w.]+\s*)\}\}")


def evaluate_expression(expression: str, context: Dict[str, str]) -> Optional[str]:
    """Safely evaluate a simple computed expression with given context."""
    if not expression:
        return None
    try:
        # Only allow basic math and context variables
        safe_dict = {"__builtins__": {}}
        safe_dict.update({k: float(v) if v.replace(".", "", 1).isdigit() else v for k, v in context.items()})
        result = eval(expression, safe_dict)
        return str(result)
    except Exception:
        return None


async def collect_variables(
    session: AsyncSession,
    project_id: Optional[int] = None,
    document_id: Optional[int] = None,
) -> Dict[str, str]:
    """Collect variables with hierarchy: global → project → document → computed."""
    variables: Dict[str, str] = {}

    # Global variables
    global_result = await session.execute(
        select(Variable).where(Variable.scope == "global")
    )
    for var in global_result.scalars().all():
        variables[var.key] = var.value or var.default_value or ""

    # Project variables
    if project_id:
        project_result = await session.execute(
            select(Variable).where(
                Variable.scope == "project",
                Variable.project_id == project_id,
            )
        )
        for var in project_result.scalars().all():
            variables[var.key] = var.value or var.default_value or ""

    # Document variables
    if document_id:
        doc_result = await session.execute(
            select(Variable).where(
                Variable.scope == "document",
                Variable.document_id == document_id,
            )
        )
        for var in doc_result.scalars().all():
            variables[var.key] = var.value or var.default_value or ""

    # Computed variables (project or document level)
    computed_result = await session.execute(
        select(Variable).where(
            Variable.is_computed == True,
            Variable.project_id.in_([project_id]) if project_id else True,
        )
    )
    for var in computed_result.scalars().all():
        if var.computed_expression:
            computed_value = evaluate_expression(var.computed_expression, variables)
            if computed_value is not None:
                variables[var.key] = computed_value

    return variables


def substitute_template(template: str, variables: Dict[str, str]) -> str:
    """Replace {{key}} with values. Leave unmatched variables as-is."""
    def replacer(match: re.Match) -> str:
        key = match.group(1).strip()
        return variables.get(key, match.group(0))
    return VARIABLE_PATTERN.sub(replacer, template)


async def render_document(
    session: AsyncSession,
    document: Document,
    extra_variables: Optional[Dict[str, str]] = None,
) -> str:
    """Render document content with variable substitution."""
    variables = await collect_variables(
        session,
        project_id=document.project_id,
        document_id=document.id,
    )
    if extra_variables:
        variables.update(extra_variables)

    template = document.content.get("template", "") if document.content else ""
    if not template:
        template = document.content.get("body", "") if document.content else ""
    return substitute_template(template, variables)


async def find_affected_documents(
    session: AsyncSession,
    project_id: int,
    changed_keys: list[str],
) -> list[Document]:
    """Find documents whose content references changed variables."""
    result = await session.execute(
        select(Document).where(Document.project_id == project_id)
    )
    docs = result.scalars().all()
    affected = []
    for doc in docs:
        template = doc.content.get("template", "") if doc.content else ""
        if not template:
            template = doc.content.get("body", "") if doc.content else ""
        for key in changed_keys:
            if f"{{{{{key}}}}}" in template:
                affected.append(doc)
                break
    return affected


async def cascade_update(
    session: AsyncSession,
    project_id: int,
    changed_keys: list[str],
) -> Dict[int, str]:
    """Update variables_snapshot for all affected documents after variable change."""
    affected = await find_affected_documents(session, project_id, changed_keys)
    snapshots: Dict[int, str] = {}
    for doc in affected:
        rendered = await render_document(session, doc)
        if doc.variables_snapshot is None:
            doc.variables_snapshot = {}
        doc.variables_snapshot["rendered"] = rendered
        doc.variables_snapshot["last_rendered_at"] = datetime.utcnow().isoformat()
        snapshots[doc.id] = rendered
    await session.commit()
    return snapshots
