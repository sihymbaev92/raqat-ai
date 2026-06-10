# -*- coding: utf-8 -*-
"""Пайдаланушы прогресі: хатым (114 сүре) — JWT Bearer."""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from db.hatim_progress_store import get_hatim_read_surahs, put_hatim_read_surahs
from db.quran_ayah_markers_store import get_quran_ayah_markers, put_quran_ayah_markers
from db.quran_last_read_store import get_quran_last_read, put_quran_last_read
from jwt_auth import platform_user_id_from_payload
from jwt_deps import get_current_user

logger = logging.getLogger("raqat_platform_api.progress")

router = APIRouter(prefix="/api/v1/me", tags=["me"])


class HatimPutBody(BaseModel):
    read_surahs: list[int] = Field(default_factory=list)


class QuranLastReadGlobalBody(BaseModel):
    surah: int
    ayah: int
    ts: str


class QuranLastReadPutBody(BaseModel):
    global_: QuranLastReadGlobalBody | None = Field(default=None, alias="global")
    by_surah: dict[str, int] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class QuranAyahMarkerBody(BaseModel):
    colorId: str = Field(alias="colorId")
    note: str = ""

    model_config = {"populate_by_name": True}


class QuranAyahMarkersPutBody(BaseModel):
    markers: dict[str, QuranAyahMarkerBody] = Field(default_factory=dict)


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


@router.get("/hatim")
def me_hatim_get(user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        surahs, updated_at = get_hatim_read_surahs(pid)
        return {"ok": True, "read_surahs": surahs, "updated_at": updated_at}
    except Exception:
        logger.exception("get_hatim failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.put("/hatim")
def me_hatim_put(body: HatimPutBody, user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        updated_at = put_hatim_read_surahs(pid, body.read_surahs)
        surahs, _ = get_hatim_read_surahs(pid)
        return {"ok": True, "read_surahs": surahs, "updated_at": updated_at}
    except Exception:
        logger.exception("put_hatim failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.get("/quran-last-read")
def me_quran_last_read_get(user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        state, updated_at = get_quran_last_read(pid)
        return {"ok": True, **state, "updated_at": updated_at}
    except Exception:
        logger.exception("get_quran_last_read failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.put("/quran-last-read")
def me_quran_last_read_put(body: QuranLastReadPutBody, user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        payload = {
            "global": body.global_.model_dump() if body.global_ else None,
            "by_surah": body.by_surah,
        }
        updated_at = put_quran_last_read(pid, payload)
        state, _ = get_quran_last_read(pid)
        return {"ok": True, **state, "updated_at": updated_at}
    except Exception:
        logger.exception("put_quran_last_read failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.get("/quran-ayah-markers")
def me_quran_ayah_markers_get(user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        markers, updated_at = get_quran_ayah_markers(pid)
        return {"ok": True, "markers": markers, "updated_at": updated_at}
    except Exception:
        logger.exception("get_quran_ayah_markers failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None


@router.put("/quran-ayah-markers")
def me_quran_ayah_markers_put(body: QuranAyahMarkersPutBody, user: dict = Depends(get_current_user)):
    pid = _require_platform_user(user)
    try:
        payload = {
            k: {"colorId": v.colorId, "note": v.note}
            for k, v in body.markers.items()
        }
        updated_at = put_quran_ayah_markers(pid, payload)
        markers, _ = get_quran_ayah_markers(pid)
        return {"ok": True, "markers": markers, "updated_at": updated_at}
    except Exception:
        logger.exception("put_quran_ayah_markers failed platform_user_id=%s", pid)
        raise HTTPException(status_code=503, detail="database_error") from None
