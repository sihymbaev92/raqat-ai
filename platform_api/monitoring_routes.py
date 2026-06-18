from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel

from jwt_auth import auth_payload_from_request, platform_user_id_from_payload
from services.client_usage_service import build_client_usage_summary, record_client_usage_event

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


class ClientUsageEvent(BaseModel):
    source: Literal["web", "app", "telegram", "api", "unknown"] = "unknown"
    eventName: str = "screen_view"
    sessionId: str | None = None
    path: str | None = None
    screen: str | None = None
    appVersion: str | None = None
    buildNumber: str | None = None
    detail: str | None = None


def _client_ip(request: Request) -> str | None:
    forwarded = (request.headers.get("x-forwarded-for") or "").split(",", 1)[0].strip()
    if forwarded:
        return forwarded
    return request.client.host if request.client else None


def _require_usage_stats_secret(value: str | None) -> None:
    expected = (
        os.getenv("RAQAT_USAGE_STATS_SECRET")
        or os.getenv("RAQAT_BOT_SYNC_SECRET")
        or ""
    ).strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail={"code": "USAGE_STATS_SECRET_NOT_CONFIGURED"},
        )
    if (value or "").strip() != expected:
        raise HTTPException(status_code=403, detail={"code": "INVALID_USAGE_STATS_SECRET"})


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


@router.post("/usage")
async def report_client_usage(payload: ClientUsageEvent, request: Request):
    auth_payload = auth_payload_from_request(request)
    record_client_usage_event(
        source=payload.source,
        event_name=payload.eventName,
        session_id=payload.sessionId,
        platform_user_id=platform_user_id_from_payload(auth_payload) if auth_payload else None,
        path=payload.path,
        screen=payload.screen,
        app_version=payload.appVersion,
        build_number=payload.buildNumber,
        user_agent=request.headers.get("user-agent"),
        ip=_client_ip(request),
        detail=payload.detail,
    )
    return {"ok": True}


@router.get("/usage/summary")
async def client_usage_summary(
    hours: int = Query(24, ge=1, le=24 * 365),
    x_raqat_usage_stats_secret: str | None = Header(None, alias="X-Raqat-Usage-Stats-Secret"),
):
    _require_usage_stats_secret(x_raqat_usage_stats_secret)
    return build_client_usage_summary(hours=hours)

