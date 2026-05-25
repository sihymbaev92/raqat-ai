# -*- coding: utf-8 -*-
"""JWT: жеке отбасылық шежіре (/api/v1/me/genealogy)."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db.family_tree.repository import add_related_person, get_tree_view, upsert_self_person
from db.get_db import get_db
from jwt_auth import platform_user_id_from_payload
from jwt_deps import get_current_user

logger = logging.getLogger("raqat_platform_api.family_tree")

router = APIRouter(prefix="/api/v1/me", tags=["me"])


class SelfPersonBody(BaseModel):
    name_kk: str = Field(..., min_length=1, max_length=200)
    gender: str = Field(default="unknown", max_length=16)
    birth_year: int | None = Field(default=None, ge=1000, le=2200)
    death_year: int | None = Field(default=None, ge=1000, le=2200)
    clan_slug: str | None = Field(default=None, max_length=64)
    notes_kk: str | None = Field(default=None, max_length=2000)


class AddPersonBody(BaseModel):
    name_kk: str = Field(..., min_length=1, max_length=200)
    relation: str = Field(..., description="father | mother | child")
    relative_to_id: str | None = Field(default=None, max_length=64)
    gender: str = Field(default="unknown", max_length=16)
    birth_year: int | None = Field(default=None, ge=1000, le=2200)
    death_year: int | None = Field(default=None, ge=1000, le=2200)
    clan_slug: str | None = Field(default=None, max_length=64)
    notes_kk: str | None = Field(default=None, max_length=2000)


def _require_platform_user(user: dict) -> str:
    pid = platform_user_id_from_payload(user)
    if not pid:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PLATFORM_USER_REQUIRED",
                "message": "Log in again: account must be linked to a platform user id.",
            },
        )
    return pid


def _map_value_error(e: ValueError) -> HTTPException:
    code = str(e)
    status = 400
    if code == "self_required":
        status = 409
    if code == "person_not_in_tree":
        status = 404
    return HTTPException(status_code=status, detail={"code": code.upper(), "message": code})


@router.get("/genealogy")
def me_genealogy_get(user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        with get_db() as conn:
            from db.family_tree.repository import ensure_tables

            ensure_tables(conn)
            view = get_tree_view(conn, pid)
            conn.commit()
        return {"ok": True, **view}
    except Exception:
        logger.exception("get family tree failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.put("/genealogy/self")
def me_genealogy_put_self(body: SelfPersonBody, user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        with get_db() as conn:
            from db.family_tree.repository import ensure_tables

            ensure_tables(conn)
            person = upsert_self_person(
                conn,
                pid,
                name_kk=body.name_kk,
                gender=body.gender,
                birth_year=body.birth_year,
                death_year=body.death_year,
                clan_slug=body.clan_slug,
                notes_kk=body.notes_kk,
            )
            view = get_tree_view(conn, pid)
            conn.commit()
        return {"ok": True, "person": person, **view}
    except ValueError as e:
        raise _map_value_error(e) from e
    except Exception:
        logger.exception("put self person failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.post("/genealogy/persons")
def me_genealogy_add_person(body: AddPersonBody, user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        with get_db() as conn:
            from db.family_tree.repository import ensure_tables

            ensure_tables(conn)
            person = add_related_person(
                conn,
                pid,
                name_kk=body.name_kk,
                relation=body.relation,
                relative_to_id=body.relative_to_id,
                gender=body.gender,
                birth_year=body.birth_year,
                death_year=body.death_year,
                clan_slug=body.clan_slug,
                notes_kk=body.notes_kk,
            )
            view = get_tree_view(conn, pid)
            conn.commit()
        return {"ok": True, "person": person, **view}
    except ValueError as e:
        raise _map_value_error(e) from e
    except Exception:
        logger.exception("add family person failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None
