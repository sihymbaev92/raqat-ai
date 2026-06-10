"""genealogy ltree graph engine (A1)

Revision ID: 001_genealogy_ltree
Revises:
Create Date: 2026-05-24

"""
from typing import Sequence, Union

from alembic import op

revision: str = "001_genealogy_ltree"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS ltree")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS genealogy_nodes (
            id UUID PRIMARY KEY NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            name_kk TEXT NOT NULL,
            name_kk_alt TEXT NULL,
            name_lat TEXT NULL,
            level SMALLINT NOT NULL CHECK (level BETWEEN 1 AND 5),
            path LTREE NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_published BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_path_gist ON genealogy_nodes USING GIST (path)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_genealogy_nodes_level_sort ON genealogy_nodes (level, sort_order)"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS genealogy_edges (
            id BIGSERIAL PRIMARY KEY,
            parent_id UUID NOT NULL REFERENCES genealogy_nodes(id) ON DELETE RESTRICT,
            child_id UUID NOT NULL REFERENCES genealogy_nodes(id) ON DELETE RESTRICT,
            source_key TEXT NOT NULL,
            citation_note TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_genealogy_edges_parent_child UNIQUE (parent_id, child_id),
            CONSTRAINT ck_genealogy_edges_no_self CHECK (parent_id <> child_id)
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS idx_genealogy_edges_parent ON genealogy_edges (parent_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_genealogy_edges_child ON genealogy_edges (child_id)")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS genealogy_closure (
            ancestor_id UUID NOT NULL REFERENCES genealogy_nodes(id) ON DELETE CASCADE,
            descendant_id UUID NOT NULL REFERENCES genealogy_nodes(id) ON DELETE CASCADE,
            depth INTEGER NOT NULL,
            PRIMARY KEY (ancestor_id, descendant_id)
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_genealogy_closure_descendant ON genealogy_closure (descendant_id, depth)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_genealogy_closure_ancestor ON genealogy_closure (ancestor_id, depth)"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS genealogy_closure")
    op.execute("DROP TABLE IF EXISTS genealogy_edges")
    op.execute("DROP TABLE IF EXISTS genealogy_nodes")
    # ltree extension left installed (shared cluster extension)
