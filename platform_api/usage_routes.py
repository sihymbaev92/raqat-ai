# -*- coding: utf-8 -*-
"""Usage және billing (MVP): ledger агрегациясы."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from db.governance_store import usage_summary_for_platform_user
from db_reader import resolve_db_path
from jwt_auth import platform_user_id_from_payload
from jwt_deps import get_current_user

router = APIRouter(prefix="/api/v1", tags=["usage"])


@router.get("/usage/me")
def usage_me(
    user: dict = Depends(get_current_user),
    days: int = Query(30, ge=1, le=366),
):
    pid = platform_user_id_from_payload(user)
    db_path = str(resolve_db_path())
    if not pid:
        return {
            "ok": True,
            "period_days": days,
            "platform_user_id": None,
            "usage": {"ai_units": 0, "events": 0, "by_type": {}},
            "note": "bootstrap_login_sub_not_uuid",
        }
    summary = usage_summary_for_platform_user(db_path, pid, days=days)
    return {"ok": True, "period_days": days, "platform_user_id": pid, "usage": summary}


@router.get("/billing/me")
def billing_me(
    user: dict = Depends(get_current_user),
    days: int = Query(30, ge=1, le=366),
):
    """Төлем шлюзі әлі қосылмаған; жоспар + usage бір JSON."""
    pid = platform_user_id_from_payload(user)
    db_path = str(resolve_db_path())
    summary = (
        usage_summary_for_platform_user(db_path, pid, days=days)
        if pid
        else {"ai_units": 0, "events": 0, "by_type": {}}
    )
    return {
        "ok": True,
        "plan": "free",
        "status": "active",
        "currency": "none",
        "period_days": days,
        "platform_user_id": pid,
        "usage": summary,
        "note_kk": "Нақты төлем (Stripe/қазақстандық провайдер) келесі фаза.",
    }
