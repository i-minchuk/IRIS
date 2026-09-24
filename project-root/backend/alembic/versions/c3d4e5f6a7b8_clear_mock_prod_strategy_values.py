"""clear_mock_prod_strategy_values

Очистка моковых измеренных значений производственного процесса (вкладка «Стратегия»):
значения KPI узлов, представляющие статистику (не нормативы), обнуляются,
загрузка сотрудников (prod_employees.kpi_load) сбрасывается в 0.
Поля остаются на месте — после появления реальных данных значения
подставятся через API автоматически. Идемпотентно.

Revision ID: c3d4e5f6a7b8
Revises: c9d0e1f2a3b4
Create Date: 2026-09-24

"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import bindparam, text


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'c9d0e1f2a3b4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# id сотрудников базового сида (моковая загрузка)
_SEED_EMPLOYEE_IDS = (
    'emp1', 'emp2', 'emp3', 'emp4', 'emp5', 'emp6', 'emp7',
    'emp8', 'emp9', 'emp10', 'emp11', 'emp12', 'emp13',
)


# (node_id) -> множество label KPI, чьи значения были моковыми
_MOCK_KPI_LABELS = {
    'task_tender': {'Выигранные тендеры', 'Время подготовки КП', 'Кол-во тендеров/мес'},
    'task_tz': {'Кол-во итераций', 'Загрузка инженера'},
    'task_schema': {'Ошибки в ревизии'},
    'task_spec': {'Точность BOM'},
    'task_bom': {'Число замен позиций'},
    'task_purchase': {'Срок поставки (ср.)', 'Дефицит позиций', 'Соотв. бюджету'},
    'task_incoming': {'% брака при поставке'},
    'task_warehouse': {'Точность комплектации', 'Время выдачи'},
    'task_montage': {'Отклонение от плана'},
    'task_wiring': {'Ошибки разводки', 'Переделки'},
    'task_test': {'Процент с первого предъявления', 'Среднее время наладки'},
    'task_otk': {'% изделий с замечаниями'},
    'task_shipping': {'Своевременность отгрузки', 'Рекламации'},
}


def _as_list(raw) -> list:
    if isinstance(raw, str):
        try:
            parsed = json.loads(raw)
        except (ValueError, TypeError):
            return []
        return parsed if isinstance(parsed, list) else []
    return raw if isinstance(raw, list) else []


def upgrade() -> None:
    conn = op.get_bind()

    # Загрузка сотрудников сида: моковые проценты -> 0 (нет данных)
    conn.execute(
        text('UPDATE prod_employees SET kpi_load = 0 WHERE id IN :ids').bindparams(
            bindparam('ids', expanding=True)
        ),
        {'ids': _SEED_EMPLOYEE_IDS},
    )

    # KPI узлов: моковые измеренные значения -> пустая строка (поле остаётся)
    rows = conn.execute(
        text('SELECT id, kpis FROM prod_process_nodes')
    ).fetchall()
    for node_id, kpis_raw in rows:
        labels = _MOCK_KPI_LABELS.get(node_id)
        if not labels:
            continue
        kpis = _as_list(kpis_raw)
        changed = False
        new_kpis = []
        for kpi in kpis:
            if (
                isinstance(kpi, dict)
                and kpi.get('label') in labels
                and kpi.get('value') not in (None, '')
            ):
                kpi = {**kpi, 'value': ''}
                changed = True
            new_kpis.append(kpi)
        if changed:
            conn.execute(
                text('UPDATE prod_process_nodes SET kpis = :kpis WHERE id = :id'),
                {'kpis': json.dumps(new_kpis, ensure_ascii=False), 'id': node_id},
            )


def downgrade() -> None:
    # Восстановление моковых значений не требуется
    pass
