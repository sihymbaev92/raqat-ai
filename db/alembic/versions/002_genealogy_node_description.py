"""genealogy_nodes description_kk column

Revision ID: 002_genealogy_node_description
Revises: 001_genealogy_ltree
Create Date: 2026-05-25

"""
from typing import Sequence, Union

from alembic import op

revision: str = "002_genealogy_node_description"
down_revision: Union[str, None] = "001_genealogy_ltree"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        ALTER TABLE genealogy_nodes
        ADD COLUMN IF NOT EXISTS description_kk TEXT NULL
        """
    )


def downgrade() -> None:
    op.execute("ALTER TABLE genealogy_nodes DROP COLUMN IF EXISTS description_kk")
