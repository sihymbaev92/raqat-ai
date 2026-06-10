# -*- coding: utf-8 -*-
"""Public genealogy read API."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from db.genealogy.persons_repository import (
    get_person_detail,
    list_persons_by_clan,
    persons_table_exists,
    search_persons,
)
from db.genealogy.repository import get_clan_detail, list_children
from db.get_db import get_db

logger = logging.getLogger("raqat_platform_api.genealogy")

router = APIRouter(prefix="/api/v1/genealogy", tags=["genealogy"])


@router.get("/clans")
def genealogy_list_clans(parent_slug: str | None = Query(None, alias="parent")):
    """Children of parent slug; omit parent for level-1 zhuz list."""
    try:
        with get_db() as conn:
            items = list_children(conn, parent_slug)
        return {"ok": True, "parent": parent_slug, "items": items, "count": len(items)}
    except Exception:
        logger.exception("genealogy list failed parent=%s", parent_slug)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.get("/clans/{slug}")
def genealogy_get_clan(slug: str):
    try:
        with get_db() as conn:
            detail = get_clan_detail(conn, slug.strip().lower())
        if not detail:
            raise HTTPException(status_code=404, detail="not_found")
        return {"ok": True, "clan": detail}
    except HTTPException:
        raise
    except Exception:
        logger.exception("genealogy detail failed slug=%s", slug)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.get("/clans/{slug}/persons")
def genealogy_list_clan_persons(
    slug: str,
    era: str | None = Query(None, description="historical | contemporary"),
):
    try:
        with get_db() as conn:
            if not persons_table_exists(conn):
                return {"ok": True, "clan_slug": slug, "items": [], "count": 0}
            items = list_persons_by_clan(conn, slug.strip().lower(), era=era)
        return {"ok": True, "clan_slug": slug, "items": items, "count": len(items)}
    except Exception:
        logger.exception("genealogy persons failed clan=%s", slug)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.get("/persons")
def genealogy_search_persons(
    q: str = Query("", min_length=1),
    limit: int = Query(40, ge=1, le=100),
):
    try:
        with get_db() as conn:
            if not persons_table_exists(conn):
                return {"ok": True, "items": [], "count": 0}
            items = search_persons(conn, q, limit=limit)
        return {"ok": True, "items": items, "count": len(items)}
    except Exception:
        logger.exception("genealogy person search failed q=%s", q)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.get("/persons/{slug}")
def genealogy_get_person(slug: str):
    try:
        with get_db() as conn:
            if not persons_table_exists(conn):
                raise HTTPException(status_code=404, detail="not_found")
            detail = get_person_detail(conn, slug.strip().lower())
        if not detail:
            raise HTTPException(status_code=404, detail="not_found")
        return {"ok": True, "person": detail}
    except HTTPException:
        raise
    except Exception:
        logger.exception("genealogy person detail failed slug=%s", slug)
        raise HTTPException(status_code=503, detail="database_error") from None
