"""family tree (P3)

Revision ID: 004_family_tree
Revises: 003_genealogy_persons
Create Date: 2026-05-25

"""
from typing import Sequence, Union

from alembic import op

revision: str = "004_family_tree"
down_revision: Union[str, None] = "003_genealogy_persons"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS family_trees (
            id TEXT PRIMARY KEY NOT NULL,
            platform_user_id TEXT NOT NULL UNIQUE,
            self_person_id TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS family_persons (
            id TEXT PRIMARY KEY NOT NULL,
            tree_id TEXT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
            name_kk TEXT NOT NULL,
            gender TEXT NOT NULL DEFAULT 'unknown'
                CHECK (gender IN ('male', 'female', 'unknown')),
            birth_year SMALLINT NULL,
            death_year SMALLINT NULL,
            clan_slug TEXT NULL,
            notes_kk TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS family_edges (
            id BIGSERIAL PRIMARY KEY,
            tree_id TEXT NOT NULL REFERENCES family_trees(id) ON DELETE CASCADE,
            parent_id TEXT NOT NULL REFERENCES family_persons(id) ON DELETE CASCADE,
            child_id TEXT NOT NULL REFERENCES family_persons(id) ON DELETE CASCADE,
            relation TEXT NOT NULL CHECK (relation IN ('father', 'mother')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (parent_id, child_id),
            UNIQUE (tree_id, child_id, relation)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_family_persons_tree ON family_persons (tree_id)")
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_family_edges_tree_child ON family_edges (tree_id, child_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_family_edges_tree_parent ON family_edges (tree_id, parent_id)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS family_edges")
    op.execute("DROP TABLE IF EXISTS family_persons")
    op.execute("DROP TABLE IF EXISTS family_trees")
