# -*- coding: utf-8 -*-
"""AI: X-Raqat-Ai-Secret немесе JWT scope «ai». Контент: құпия немесе JWT «content»."""
from __future__ import annotations

import os

from fastapi import Header, HTTPException, Request

from jwt_auth import auth_payload_from_request, payload_scopes


def require_ai_access(
    request: Request,
    x_raqat_ai_secret: str | None = Header(None, alias="X-Raqat-Ai-Secret"),
) -> None:
    expected = (os.getenv("RAQAT_AI_PROXY_SECRET") or "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "AI_PROXY_NOT_CONFIGURED",
                "message": "Set RAQAT_AI_PROXY_SECRET and GEMINI_API_KEY on the API server.",
            },
        )
    if (x_raqat_ai_secret or "").strip() == expected:
        return
    pl = auth_payload_from_request(request)
    if pl and "ai" in payload_scopes(pl):
        return
    raise HTTPException(
        status_code=401,
        detail={
            "code": "INVALID_AI_AUTH",
            "message": "Use X-Raqat-Ai-Secret or Authorization: Bearer JWT with scope ai.",
        },
    )


def optional_content_read_secret(
    request: Request,
    x_raqat_content_secret: str | None = Header(None, alias="X-Raqat-Content-Secret"),
) -> None:
    """RAQAT_CONTENT_READ_SECRET толтырылса: header немесе JWT scope content."""
    expected = (os.getenv("RAQAT_CONTENT_READ_SECRET") or "").strip()
    if not expected:
        return
    if (x_raqat_content_secret or "").strip() == expected:
        return
    pl = auth_payload_from_request(request)
    if pl and "content" in payload_scopes(pl):
        return
    raise HTTPException(
        status_code=401,
        detail={
            "code": "INVALID_CONTENT_AUTH",
            "message": "Missing X-Raqat-Content-Secret or Bearer JWT with scope content.",
        },
    )
