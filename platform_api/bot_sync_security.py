# -*- coding: utf-8 -*-
"""Telegram боттың платформа DB-мен синхроны: `X-Raqat-Bot-Sync-Secret`."""
from __future__ import annotations

import os

from fastapi import Header, HTTPException


def require_bot_sync_secret(
    x_raqat_bot_sync_secret: str | None = Header(None, alias="X-Raqat-Bot-Sync-Secret"),
) -> None:
    expected = (os.getenv("RAQAT_BOT_SYNC_SECRET") or "").strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "BOT_SYNC_DISABLED",
                "message": "RAQAT_BOT_SYNC_SECRET is not set on the server.",
            },
        )
    if (x_raqat_bot_sync_secret or "").strip() != expected:
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_BOT_SYNC_SECRET", "message": "Bad X-Raqat-Bot-Sync-Secret."},
        )
