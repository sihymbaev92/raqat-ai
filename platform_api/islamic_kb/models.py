# -*- coding: utf-8 -*-
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class IslamicKbHit:
    chunk_id: int
    document_id: int
    source_site: str
    canonical_url: str
    title: str
    text_plain: str
    score: float


@dataclass(frozen=True)
class IslamicKbSource:
    site: str
    title: str
    url: str

    def as_dict(self) -> dict:
        return {"site": self.site, "title": self.title, "url": self.url}


@dataclass(frozen=True)
class IslamicKbArticleResult:
    """Мобильді іздеу: толық мәтін емес — title + excerpt + дереккөз."""

    document_id: int
    source_site: str
    source_label: str
    title: str
    excerpt: str
    url: str
    score: float
    published_at: str | None = None
    image_url: str | None = None

    def as_dict(self) -> dict:
        out = {
            "document_id": self.document_id,
            "site": self.source_site,
            "source_label": self.source_label,
            "title": self.title,
            "excerpt": self.excerpt,
            "url": self.url,
            "score": round(self.score, 4),
        }
        if self.published_at:
            out["published_at"] = self.published_at
        if self.image_url:
            out["image_url"] = self.image_url
        return out
