from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/client", tags=["client-monitoring"])
logger = logging.getLogger("raqat_client_errors")


def _trim(value: str | None, limit: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    return text[:limit]


class ClientErrorReport(BaseModel):
    kind: Literal["render", "unhandled", "manual"] = "render"
    platform: str = "unknown"
    appVersion: str | None = None
    buildNumber: str | None = None
    errorName: str | None = None
    message: str = ""
    stack: str | None = None
    componentStack: str | None = None
    route: str | None = None
    deviceModel: str | None = None


@router.post("/errors")
async def report_client_error(payload: ClientErrorReport, request: Request):
    """
    Privacy-safe mobile/web client error intake.

    This intentionally stores nothing in app DB yet; production log shipping
    can collect the structured warning without adding a third-party SDK.
    """
    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "kind": payload.kind,
        "platform": _trim(payload.platform, 32),
        "appVersion": _trim(payload.appVersion, 32),
        "buildNumber": _trim(payload.buildNumber, 32),
        "errorName": _trim(payload.errorName, 120),
        "message": _trim(payload.message, 800),
        "stack": _trim(payload.stack, 1600),
        "componentStack": _trim(payload.componentStack, 1600),
        "route": _trim(payload.route, 160),
        "deviceModel": _trim(payload.deviceModel, 120),
        "userAgent": _trim(request.headers.get("user-agent"), 240),
    }
    logger.warning("client_error_report %s", record)
    return {"ok": True}

