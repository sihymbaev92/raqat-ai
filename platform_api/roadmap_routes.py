# -*- coding: utf-8 -*-
"""
Профиль және AI тарих API.
Толық сипаттама: docs/PLATFORM_ROADMAP_API_AI_USERS.md
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from db.platform_identity_chat import list_user_chat_history
from db_reader import resolve_db_path
from jwt_auth import platform_user_id_from_payload
from jwt_deps import get_current_user

router = APIRouter(prefix="/api/v1", tags=["roadmap"])


def _as_int_or_none(v: object) -> int | None:
    if v is None:
        return None
    try:
        return int(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None


@router.get("/users/me")
def users_me(user: dict = Depends(get_current_user)):
    pid = platform_user_id_from_payload(user)
    tid = _as_int_or_none(user.get("telegram_user_id"))
    return {
        "ok": True,
        "sub": user.get("sub"),
        "platform_user_id": pid,
        "telegram_user_id": tid,
        "apple_sub": user.get("apple_sub"),
        "google_sub": user.get("google_sub"),
        "scopes": user.get("scopes") if isinstance(user.get("scopes"), list) else [],
    }


@router.get("/users/me/history")
def users_history(
    user: dict = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=200),
    before_id: int | None = Query(None, description="Келесі бет: осы id-ден кіші жолдар (ескірек)"),
    role: str | None = Query(None, max_length=16, description="user | assistant"),
):
    pid = platform_user_id_from_payload(user)
    if not pid:
        return {
            "ok": True,
            "items": [],
            "next_before_id": None,
            "filter_note": "bootstrap_login_sub_not_uuid_no_chat_history",
        }
    items, next_before = list_user_chat_history(
        str(resolve_db_path()),
        pid,
        limit=limit,
        before_id=before_id,
        role=role,
    )
    return {
        "ok": True,
        "items": items,
        "next_before_id": next_before,
        "platform_user_id": pid,
    }
