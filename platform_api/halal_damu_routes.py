# -*- coding: utf-8 -*-
"""GET /api/v1/halal-damu/* — halaldamu.kz JSON прокси (кэш, allowlist)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from ai_security import optional_content_read_secret
from halal_damu_proxy import (
    cache_stats,
    clear_halal_damu_cache,
    fetch_halal_damu_json,
    halal_damu_origin,
    halal_damu_proxy_enabled,
    validate_halal_damu_path,
)

router = APIRouter(prefix="/api/v1/halal-damu", tags=["halal-damu"])


@router.get("/status")
def halal_damu_status() -> dict:
    return {
        "ok": True,
        "enabled": halal_damu_proxy_enabled(),
        "origin": halal_damu_origin(),
        "cache": cache_stats(),
    }


@router.post("/cache/clear", dependencies=[Depends(optional_content_read_secret)])
def halal_damu_cache_clear() -> dict:
    """Әкімшілік: кэшті тазалау. RAQAT_CONTENT_READ_SECRET орнатылса — header/JWT керек."""
    n = clear_halal_damu_cache()
    return {"ok": True, "cleared": n}


@router.get("/{full_path:path}")
def halal_damu_proxy_get(
    full_path: str,
    request: Request,
    force_network: bool = Query(False, alias="force_network"),
) -> JSONResponse:
    if not halal_damu_proxy_enabled():
        raise HTTPException(status_code=503, detail={"error": "halal_damu_proxy_disabled"})
    try:
        validate_halal_damu_path(full_path)
    except ValueError as exc:
        code = str(exc)
        status = 404 if code == "path_required" else 403
        raise HTTPException(status_code=status, detail={"error": code}) from exc

    query = {k: v for k, v in request.query_params.items() if k != "force_network"}
    try:
        status, payload, extra_headers = fetch_halal_damu_json(
            full_path,
            query,
            force_network=force_network,
        )
    except ValueError as exc:
        raise HTTPException(status_code=403, detail={"error": str(exc)}) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail={"error": "upstream_unreachable", "reason": str(exc)[:200]},
        ) from exc

    if payload is None and status >= 400:
        raise HTTPException(status_code=status, detail={"error": "upstream_error"})

    return JSONResponse(
        content=payload if payload is not None else {},
        status_code=status,
        headers=extra_headers,
    )
