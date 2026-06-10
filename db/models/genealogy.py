# -*- coding: utf-8 -*-
"""Genealogy A1 — SQLAlchemy 2.0 models (PostgreSQL + ltree)."""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.models.base import Base


class GenealogyNode(Base):
    __tablename__ = "genealogy_nodes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name_kk: Mapped[str] = mapped_column(Text, nullable=False)
    name_kk_alt: Mapped[str | None] = mapped_column(Text, nullable=True)
    name_lat: Mapped[str | None] = mapped_column(Text, nullable=True)
    level: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    path: Mapped[str] = mapped_column(Text, nullable=False)  # PG column type LTREE in migration
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    parent_edges: Mapped[list["GenealogyEdge"]] = relationship(
        foreign_keys="GenealogyEdge.child_id",
        back_populates="child",
    )
    child_edges: Mapped[list["GenealogyEdge"]] = relationship(
        foreign_keys="GenealogyEdge.parent_id",
        back_populates="parent",
    )

    __table_args__ = (
        Index("idx_genealogy_nodes_path_gist", "path", postgresql_using="gist"),
        Index("idx_genealogy_nodes_level_sort", "level", "sort_order"),
    )


class GenealogyEdge(Base):
    __tablename__ = "genealogy_edges"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    parent_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("genealogy_nodes.id", ondelete="RESTRICT"), nullable=False
    )
    child_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("genealogy_nodes.id", ondelete="RESTRICT"), nullable=False
    )
    source_key: Mapped[str] = mapped_column(String(64), nullable=False)
    citation_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    parent: Mapped["GenealogyNode"] = relationship(foreign_keys=[parent_id], back_populates="child_edges")
    child: Mapped["GenealogyNode"] = relationship(foreign_keys=[child_id], back_populates="parent_edges")

    __table_args__ = (
        UniqueConstraint("parent_id", "child_id", name="uq_genealogy_edges_parent_child"),
        CheckConstraint("parent_id <> child_id", name="ck_genealogy_edges_no_self"),
        Index("idx_genealogy_edges_parent", "parent_id"),
        Index("idx_genealogy_edges_child", "child_id"),
    )


class GenealogyClosure(Base):
    __tablename__ = "genealogy_closure"

    ancestor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("genealogy_nodes.id", ondelete="CASCADE"), primary_key=True
    )
    descendant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("genealogy_nodes.id", ondelete="CASCADE"), primary_key=True
    )
    depth: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (
        Index("idx_genealogy_closure_descendant", "descendant_id", "depth"),
        Index("idx_genealogy_closure_ancestor", "ancestor_id", "depth"),
    )
