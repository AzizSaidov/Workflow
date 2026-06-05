"""drop freelancer_profiles.category_id (merged into ProfileCategory M2M "Специализация")

Revision ID: b2c1a9d7e3f5
Revises: 045713092286
Create Date: 2026-06-06

Категория и специализация фрилансера были дублирующими сущностями. Одиночное
поле freelancer_profiles.category_id убрано — единственным источником остаётся
M2M-таблица profile_categories (отображается в UI как «Специализация»).

Миграция написана защищённо: если колонки уже нет (например, схема создана
заново через seed.py --force / Base.metadata.create_all из новых моделей),
upgrade ничего не делает и не падает.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c1a9d7e3f5'
down_revision: Union[str, Sequence[str], None] = '045713092286'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table: str, column: str) -> bool:
    insp = sa.inspect(op.get_bind())
    return column in [c["name"] for c in insp.get_columns(table)]


def upgrade() -> None:
    if not _has_column("freelancer_profiles", "category_id"):
        return
    insp = sa.inspect(op.get_bind())
    for fk in insp.get_foreign_keys("freelancer_profiles"):
        if "category_id" in (fk.get("constrained_columns") or []) and fk.get("name"):
            op.drop_constraint(fk["name"], "freelancer_profiles", type_="foreignkey")
    op.drop_column("freelancer_profiles", "category_id")


def downgrade() -> None:
    if _has_column("freelancer_profiles", "category_id"):
        return
    op.add_column(
        "freelancer_profiles",
        sa.Column("category_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_freelancer_profiles_category_id_categories",
        "freelancer_profiles", "categories",
        ["category_id"], ["id"],
    )
