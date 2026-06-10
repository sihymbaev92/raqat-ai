"""genealogy persons (P2)

Revision ID: 003_genealogy_persons
Revises: 002_genealogy_node_description
Create Date: 2026-05-25

"""
from typing import Sequence, Union

from alembic import op

revision: str = "003_genealogy_persons"
down_revision: Union[str, None] = "002_genealogy_node_description"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS genealogy_persons (
            id TEXT PRIMARY KEY NOT NULL,
            clan_slug TEXT NOT NULL REFERENCES genealogy_clans(id) ON DELETE RESTRICT,
            name_kk TEXT NOT NULL,
            name_lat TEXT NULL,
            birth_year SMALLINT NULL,
            death_year SMALLINT NULL,
            era TEXT NOT NULL DEFAULT 'historical'
                CHECK (era IN ('historical', 'contemporary')),
            role_kk TEXT NULL,
            bio_kk TEXT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_published BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_genealogy_persons_clan ON genealogy_persons (clan_slug, sort_order)"
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS genealogy_person_source_refs (
            id BIGSERIAL PRIMARY KEY,
            person_id TEXT NOT NULL REFERENCES genealogy_persons(id) ON DELETE CASCADE,
            source_key TEXT NOT NULL,
            citation_note TEXT NULL,
            page_or_section TEXT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (person_id, source_key)
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS genealogy_person_source_refs")
    op.execute("DROP TABLE IF EXISTS genealogy_persons")
