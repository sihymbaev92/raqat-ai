# -*- coding: utf-8 -*-
"""Пайдаланушы прогресі: хатым (114 сүре) — JWT Bearer."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db.hatim_progress_store import get_hatim_read_surahs, put_hatim_read_surahs
from jwt_auth import platform_user_id_from_payload
from jwt_deps import get_current_user

logger = logging.getLogger("raqat_platform_api.progress")

router = APIRouter(prefix="/api/v1/me", tags=["me"])


class HatimPutBody(BaseModel):
    read_surahs: list[int] = Field(default_factory=list)


@router.get("/hatim")
def me_hatim_get(user: dict = Depends(get_current_user)):
    pid = platform_user_id_from_payload(user)
    if not pid:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PLATFORM_USER_REQUIRED",
                "message": "Log in again: account must be linked to a platform user id.",
            },
        )
    try:
        surahs, updated_at = get_hatim_read_surahs(pid)
        return {"ok": True, "read_surahs": surahs, "updated_at": updated_at}
    except Exception:
        logger.exception("get_hatim failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.put("/hatim")
def me_hatim_put(body: HatimPutBody, user: dict = Depends(get_current_user)):
    pid = platform_user_id_from_payload(user)
    if not pid:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PLATFORM_USER_REQUIRED",
                "message": "Log in again: account must be linked to a platform user id.",
            },
        )
    try:
        updated_at = put_hatim_read_surahs(pid, body.read_surahs)
        surahs, _ = get_hatim_read_surahs(pid)
        return {"ok": True, "read_surahs": surahs, "updated_at": updated_at}
    except Exception:
        logger.exception("put_hatim failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None
