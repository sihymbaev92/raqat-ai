# -*- coding: utf-8 -*-
"""Қауымдық дұға: барлық қолданушыларға ортақ тізім, әмин."""
from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from db.community_store import add_amen, create_dua, list_duas

logger = logging.getLogger("raqat_platform_api.community")

router = APIRouter(prefix="/api/v1/community", tags=["community"])


class DuaCreateBody(BaseModel):
    text: str = Field(..., min_length=1, max_length=450)


def _client_id(x_raqat_client_id: str | None) -> str:
    cid = (x_raqat_client_id or "").strip()
    if len(cid) < 8:
        raise HTTPException(status_code=400, detail="X-Raqat-Client-Id required (min 8 chars)")
    if len(cid) > 128:
        raise HTTPException(status_code=400, detail="X-Raqat-Client-Id too long")
    return cid


@router.get("/duas")
def get_duas(limit: Annotated[int, Query(ge=1, le=100)] = 35):
    try:
        rows = list_duas(limit=limit)
        return {"ok": True, "duas": rows}
    except Exception:
        logger.exception("list_duas failed")
        raise HTTPException(status_code=503, detail="database_error") from None


@router.post("/duas")
def post_dua(
    body: DuaCreateBody,
    x_raqat_client_id: Annotated[str | None, Header(alias="X-Raqat-Client-Id")] = None,
):
    cid = _client_id(x_raqat_client_id)
    try:
        new_id, err = create_dua(cid, body.text)
        if err == "rate_limited":
            raise HTTPException(status_code=429, detail="rate_limited")
        if err == "body_too_short":
            raise HTTPException(status_code=400, detail="body_too_short")
        if err == "body_too_long":
            raise HTTPException(status_code=400, detail="body_too_long")
        if new_id is None:
            raise HTTPException(status_code=400, detail=err or "create_failed")
        return {"ok": True, "id": new_id}
    except HTTPException:
        raise
    except Exception:
        logger.exception("create_dua failed")
        raise HTTPException(status_code=503, detail="database_error") from None


@router.post("/duas/{dua_id}/amen")
def post_amen(
    dua_id: int,
    x_raqat_client_id: Annotated[str | None, Header(alias="X-Raqat-Client-Id")] = None,
):
    cid = _client_id(x_raqat_client_id)
    try:
        inserted, total, err = add_amen(dua_id, cid)
        if err == "not_found":
            raise HTTPException(status_code=404, detail="not_found")
        if err == "bad_request":
            raise HTTPException(status_code=400, detail="bad_request")
        if total is None:
            raise HTTPException(status_code=503, detail="database_error")
        return {"ok": True, "inserted": inserted, "amen_count": total}
    except HTTPException:
        raise
    except Exception:
        logger.exception("add_amen failed")
        raise HTTPException(status_code=503, detail="database_error") from None
