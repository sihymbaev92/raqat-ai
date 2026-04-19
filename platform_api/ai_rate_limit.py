# -*- coding: utf-8 -*-
"""AI endpoint-тері үшін sliding window rate limit.

Redis қолжетімді және RAQAT_AI_RL_USE_REDIS өшік емес болса — ZSET арқылы
бірнеше uvicorn worker/instance арасында ортақ лимит. Әйтпесе in-memory fallback.
"""
from __future__ import annotations

import os
import threading
import uuid
from collections import defaultdict
from time import time

from fastapi import Depends, HTTPException, Request

from ai_security import require_ai_access
from jwt_auth import auth_payload_from_request, platform_user_id_from_payload

_lock = threading.Lock()
_timestamps: dict[str, list[float]] = defaultdict(list)


def _window_seconds() -> int:
    return max(10, min(int((os.getenv("RAQAT_AI_RL_WINDOW_SECONDS") or "60").strip() or "60"), 3600))


def _max_per_window() -> int:
    raw = (os.getenv("RAQAT_AI_RL_MAX_PER_WINDOW") or "").strip()
    if raw.isdigit():
        return max(1, min(int(raw), 10_000))
    if (os.getenv("RAQAT_ENV") or "").strip().lower() in ("prod", "production"):
        return 30
    return 500


def _rate_limit_key(request: Request, payload: dict | None) -> str:
    pid = platform_user_id_from_payload(payload) if payload else None
    if pid:
        return f"pid:{pid}"
    raw = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip()
    host = raw or (request.client.host if request.client else "") or "unknown"
    return f"ip:{host}"


def _http_429(window: float, cap: int, retry_seconds: float) -> None:
    raise HTTPException(
        status_code=429,
        detail={
            "code": "AI_RATE_LIMITED",
            "message": f"Too many AI requests. Retry after ~{max(1, int(retry_seconds))}s.",
            "window_seconds": int(window),
            "max_per_window": cap,
        },
    )


def _check_ai_rate_limit_memory(request: Request, payload: dict | None) -> None:
    key = _rate_limit_key(request, payload)
    window = float(_window_seconds())
    cap = _max_per_window()
    now = time()
    cutoff = now - window
    with _lock:
        dq = _timestamps[key]
        while dq and dq[0] < cutoff:
            dq.pop(0)
        if len(dq) >= cap:
            retry = max(0.0, window - (now - dq[0]))
            _http_429(window, cap, retry)
        dq.append(now)


def _check_ai_rate_limit_redis(request: Request, payload: dict | None, client) -> None:
    key = _rate_limit_key(request, payload)
    window = float(_window_seconds())
    cap = _max_per_window()
    now = time()
    cutoff = now - window
    rkey = f"raqat:ai_rl:v1:{key}"
    member = f"{now:.9f}:{uuid.uuid4().hex}"
    pipe = client.pipeline(transaction=True)
    pipe.zremrangebyscore(rkey, "-inf", cutoff)
    pipe.zadd(rkey, {member: now})
    pipe.zcard(rkey)
    pipe.expire(rkey, int(window) + 120)
    try:
        _, _, count, _ = pipe.execute()
    except Exception:
        _check_ai_rate_limit_memory(request, payload)
        return
    if count > cap:
        try:
            client.zrem(rkey, member)
        except Exception:
            pass
        retry = float(window)
        try:
            oldest = client.zrange(rkey, 0, 0, withscores=True)
            if oldest and oldest[0] and len(oldest[0]) > 1:
                retry = max(1.0, window - (now - float(oldest[0][1])))
        except Exception:
            pass
        _http_429(window, cap, retry)


def check_ai_rate_limit_window(request: Request, payload: dict | None) -> None:
    if (os.getenv("RAQAT_AI_RL_DISABLED") or "").strip().lower() in ("1", "true", "yes"):
        return
    use_redis = (os.getenv("RAQAT_AI_RL_USE_REDIS", "1").strip().lower() not in ("0", "false", "no", "off"))
    if use_redis:
        try:
            from app.infrastructure.redis_client import get_redis_client

            rc = get_redis_client()
        except Exception:
            rc = None
        if rc is not None:
            _check_ai_rate_limit_redis(request, payload, rc)
            return
    _check_ai_rate_limit_memory(request, payload)


def require_ai_access_with_rate_limit(
    request: Request,
    _auth: None = Depends(require_ai_access),
) -> None:
    pl = auth_payload_from_request(request)
    check_ai_rate_limit_window(request, pl)
