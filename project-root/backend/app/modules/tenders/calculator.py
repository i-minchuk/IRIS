"""Tender workload calculator: norms, team composition, load chart."""
from datetime import datetime, timedelta
from typing import Dict, List, Optional

# Historical norms: hours per unit of work (approximate for small company)
NORMS: Dict[str, Dict[str, float]] = {
    "KM": {
        "assembly_drawing": 24,      # per drawing
        "detail_drawing": 8,         # per drawing
        "specification": 4,          # per spec
        "calculation_note": 16,      # per note
        "hour_per_ton": 40,          # for structural steel
    },
    "PD": {
        "drawing": 16,
        "explanatory_note": 12,
        "specification": 4,
        "hour_per_ton": 32,
    },
    "AK": {
        "reinforcement_drawing": 12,
        "bending_schedule": 8,
        "hour_per_ton": 24,
    },
    "montazh": {
        "montage_drawing": 20,
        "technology_card": 12,
        "hour_per_ton": 16,
    },
    "smety": {
        "estimate": 8,
        "hour_per_ton": 4,
    },
}

# Complexity multipliers
COMPLEXITY_MULT = {
    "low": 0.8,
    "medium": 1.0,
    "high": 1.4,
}

# Team composition by work type: role -> ratio of total hours
TEAM_ROLES: Dict[str, Dict[str, float]] = {
    "KM": {"lead_engineer": 0.15, "engineer": 0.60, "checker": 0.15, "tech_editor": 0.10},
    "PD": {"lead_engineer": 0.20, "engineer": 0.55, "checker": 0.15, "tech_editor": 0.10},
    "AK": {"lead_engineer": 0.15, "engineer": 0.55, "checker": 0.20, "tech_editor": 0.10},
    "montazh": {"lead_engineer": 0.20, "engineer": 0.50, "checker": 0.20, "tech_editor": 0.10},
    "smety": {"lead_engineer": 0.10, "engineer": 0.70, "checker": 0.15, "tech_editor": 0.05},
}

# Hours per person per month (approx 160h with some reserve)
HOURS_PER_PERSON_MONTH = 140


def calculate_tender(
    project_type: str,
    volume: float,
    volume_unit: str = "ton",
    complexity: str = "medium",
    standards: Optional[List[str]] = None,
    duration_months: Optional[int] = None,
) -> dict:
    """Calculate workload, team and load chart for a tender."""
    norms = NORMS.get(project_type, NORMS["KM"])
    mult = COMPLEXITY_MULT.get(complexity, 1.0)

    # Base hours from volume
    hour_per_unit = norms.get("hour_per_ton", 40)
    base_hours = volume * hour_per_unit * mult

    # Add standards overhead
    standards = standards or []
    std_overhead = 1.0 + (len(standards) * 0.05)  # +5% per standard
    total_hours = base_hours * std_overhead

    # Default document set
    doc_set = {
        "assembly_drawing": max(1, int(volume / 50)),
        "detail_drawing": max(2, int(volume / 10)),
        "specification": max(1, int(volume / 100)),
        "calculation_note": max(1, int(volume / 200)),
    }

    # Estimate duration if not given
    if not duration_months:
        # Small company: 5 people max per project
        max_team = 5
        min_months = max(1, int(total_hours / (max_team * HOURS_PER_PERSON_MONTH)))
        duration_months = min_months + 1  # buffer

    # Team composition
    roles = TEAM_ROLES.get(project_type, TEAM_ROLES["KM"])
    team_hours = {role: total_hours * ratio for role, ratio in roles.items()}

    # Recommended team size (round up roles that need > 0.5 FTE)
    team_size = 0
    role_counts = {}
    for role, hours in team_hours.items():
        count = max(1, round(hours / (duration_months * HOURS_PER_PERSON_MONTH)))
        role_counts[role] = count
        team_size += count

    # Monthly load chart
    months = []
    overload_risk = False
    for m in range(duration_months):
        # S-curve distribution: more load in middle months
        if duration_months == 1:
            factor = 1.0
        else:
            # Parabolic distribution peaking at middle
            x = m / (duration_months - 1)
            factor = 4 * x * (1 - x) + 0.3  # peak ~1.3 at center, min 0.3 at edges
            factor = min(1.0, factor)
        month_hours = total_hours / duration_months * factor
        utilization = month_hours / (team_size * HOURS_PER_PERSON_MONTH)
        status = "ok"
        if utilization > 0.95:
            status = "risk"
            overload_risk = True
        elif utilization > 0.85:
            status = "high"
        months.append({
            "month": m + 1,
            "hours": round(month_hours, 1),
            "utilization": round(utilization * 100, 1),
            "status": status,
        })

    recommendations = []
    if overload_risk:
        recommendations.append("Распределить нагрузку: сдвинуть дедлайн или увеличить команду")
    if team_size > 5:
        recommendations.append("Команда > 5 человек — рекомендуется разбить на подгруппы")
    if duration_months < 2 and total_hours > 500:
        recommendations.append("Сжатые сроки — высокий риск срыва, рекомендуется +2 недели")

    return {
        "total_hours": round(total_hours, 1),
        "duration_months": duration_months,
        "team_size": team_size,
        "team_composition": role_counts,
        "monthly_load": months,
        "document_estimate": doc_set,
        "overload_risk": overload_risk,
        "recommendations": recommendations,
    }
