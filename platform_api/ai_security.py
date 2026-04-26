# -*- coding: utf-8 -*-
"""AI: (міндетті емес) X-Raqat-Ai-Secret, JWT scope «ai», не құпиясыз қонақ (әдепкі, IP лимиті)."""
from __future__ import annotations

import os

from fastapi import Header, HTTPException, Request

from jwt_auth import auth_payload_from_request, payload_scopes


def _env_false(name: str) -> bool:
    return (os.getenv(name) or "").strip().lower() in ("0", "false", "no", "off")


def _allow_anonymous_ai() -> bool:
    """RAQAT_AI_ALLOW_ANONYMOUS әдепкі=1; тек 0/false/no/off тексеріледі (қонақ IP-лимит)."""
    return (os.getenv("RAQAT_AI_ALLOW_ANONYMOUS") or "1").strip().lower() not in (
        "0",
        "false",
        "no",
        "off",
    )


def require_ai_access(
    request: Request,
    x_raqat_ai_secret: str | None = Header(None, alias="X-Raqat-Ai-Secret"),
) -> None:
    expected = (os.getenv("RAQAT_AI_PROXY_SECRET") or "").strip()
    allow_header = not _env_false("RAQAT_ACCEPT_AI_PROXY_SECRET_HEADER")
    if expected and allow_header and (x_raqat_ai_secret or "").strip() == expected:
        return
    pl = auth_payload_from_request(request)
    if pl and "ai" in payload_scopes(pl):
        return
    if _allow_anonymous_ai():
        return
    raise HTTPException(
        status_code=401,
        detail={
            "code": "INVALID_AI_AUTH",
            "message": (
                "Authorization: Bearer JWT with scope ai is required, "
                "or set RAQAT_AI_ALLOW_ANONYMOUS=1 (or unset) for anonymous with IP limit."
            ),
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
    allow_header = not _env_false("RAQAT_ACCEPT_CONTENT_READ_SECRET_HEADER")
    if allow_header and (x_raqat_content_secret or "").strip() == expected:
        return
    pl = auth_payload_from_request(request)
    if pl and "content" in payload_scopes(pl):
        return
    raise HTTPException(
        status_code=401,
        detail={
            "code": "INVALID_CONTENT_AUTH",
            "message": (
                "Bearer JWT with scope content is required."
                if not allow_header
                else "Missing X-Raqat-Content-Secret or Bearer JWT with scope content."
            ),
        },
    )
