# -*- coding: utf-8 -*-
"""
JWT (HS256): access + refresh, Telegram / platform claim-тері.
Access: typ=access (немесе legacy typ жоқ). Refresh: typ=refresh + jti (rotation үшін revocation).
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from starlette.requests import Request

JWT_ALGO = "HS256"
TOKEN_TYP_ACCESS = "access"
TOKEN_TYP_REFRESH = "refresh"


def jwt_secret() -> str | None:
    """Access JWT құпиясы (кемінде 32 символ)."""
    s = (os.getenv("RAQAT_JWT_SECRET") or "").strip()
    if len(s) < 32:
        return None
    return s


def jwt_refresh_secret() -> str | None:
    """Refresh JWT; бос болса access құпиясы қолданылады."""
    s = (os.getenv("RAQAT_JWT_REFRESH_SECRET") or "").strip()
    if len(s) >= 32:
        return s
    return jwt_secret()


def _access_ttl_minutes() -> int:
    raw = (os.getenv("RAQAT_JWT_ACCESS_EXPIRE_MINUTES") or "").strip()
    if raw.isdigit():
        return max(5, min(int(raw), 24 * 60))
    legacy = (os.getenv("RAQAT_JWT_EXPIRE_MINUTES") or "").strip()
    if legacy.isdigit():
        return max(5, min(int(legacy), 24 * 60))
    return 30


def _refresh_ttl_days() -> int:
    raw = (os.getenv("RAQAT_JWT_REFRESH_EXPIRE_DAYS") or "").strip()
    if raw.isdigit():
        return max(1, min(int(raw), 365))
    return 30


def _user_claims(
    *,
    telegram_user_id: int | None,
    platform_user_id: str | None,
    apple_sub: str | None,
    google_sub: str | None,
) -> dict[str, Any]:
    out: dict[str, Any] = {}
    if telegram_user_id is not None:
        out["telegram_user_id"] = int(telegram_user_id)
    if platform_user_id:
        out["platform_user_id"] = str(platform_user_id)
    if apple_sub:
        out["apple_sub"] = str(apple_sub)[:256]
    if google_sub:
        out["google_sub"] = str(google_sub)[:256]
    return out


def _encode(payload: dict[str, Any], secret: str) -> str:
    return jwt.encode(payload, secret, algorithm=JWT_ALGO)


def create_access_token(
    *,
    subject: str,
    scopes: list[str],
    telegram_user_id: int | None = None,
    platform_user_id: str | None = None,
    apple_sub: str | None = None,
    google_sub: str | None = None,
) -> str:
    secret = jwt_secret()
    if not secret:
        raise RuntimeError("RAQAT_JWT_SECRET must be set (min 32 chars) to issue tokens")
    now = datetime.now(timezone.utc)
    minutes = _access_ttl_minutes()
    payload: dict[str, Any] = {
        "sub": subject,
        "scopes": scopes,
        "typ": TOKEN_TYP_ACCESS,
        "sid": str(uuid.uuid4()),
        "iat": int(now.timestamp()),
        "exp": now + timedelta(minutes=minutes),
        **_user_claims(
            telegram_user_id=telegram_user_id,
            platform_user_id=platform_user_id,
            apple_sub=apple_sub,
            google_sub=google_sub,
        ),
    }
    return _encode(payload, secret)


def create_refresh_token(
    *,
    subject: str,
    scopes: list[str],
    telegram_user_id: int | None = None,
    platform_user_id: str | None = None,
    apple_sub: str | None = None,
    google_sub: str | None = None,
) -> str:
    secret = jwt_refresh_secret()
    if not secret:
        raise RuntimeError("JWT refresh secret not configured")
    now = datetime.now(timezone.utc)
    days = _refresh_ttl_days()
    jti = str(uuid.uuid4())
    payload: dict[str, Any] = {
        "sub": subject,
        "scopes": scopes,
        "typ": TOKEN_TYP_REFRESH,
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": now + timedelta(days=days),
        **_user_claims(
            telegram_user_id=telegram_user_id,
            platform_user_id=platform_user_id,
            apple_sub=apple_sub,
            google_sub=google_sub,
        ),
    }
    return _encode(payload, secret)


def create_token_pair(
    *,
    subject: str,
    scopes: list[str],
    telegram_user_id: int | None = None,
    platform_user_id: str | None = None,
    apple_sub: str | None = None,
    google_sub: str | None = None,
) -> dict[str, Any]:
    access = create_access_token(
        subject=subject,
        scopes=scopes,
        telegram_user_id=telegram_user_id,
        platform_user_id=platform_user_id,
        apple_sub=apple_sub,
        google_sub=google_sub,
    )
    refresh = create_refresh_token(
        subject=subject,
        scopes=scopes,
        telegram_user_id=telegram_user_id,
        platform_user_id=platform_user_id,
        apple_sub=apple_sub,
        google_sub=google_sub,
    )
    return {
        "access_token": access,
        "refresh_token": refresh,
        "expires_in": _access_ttl_minutes() * 60,
        "refresh_expires_in": _refresh_ttl_days() * 86400,
    }


def decode_access_token(token: str) -> dict[str, Any]:
    secret = jwt_secret()
    if not secret:
        raise jwt.InvalidTokenError("JWT not configured")
    payload = jwt.decode(token, secret, algorithms=[JWT_ALGO])
    typ = payload.get("typ")
    if typ is not None and typ != TOKEN_TYP_ACCESS:
        raise jwt.InvalidTokenError("not an access token")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    secret = jwt_refresh_secret()
    if not secret:
        raise jwt.InvalidTokenError("JWT refresh not configured")
    payload = jwt.decode(token, secret, algorithms=[JWT_ALGO])
    if payload.get("typ") != TOKEN_TYP_REFRESH:
        raise jwt.InvalidTokenError("not a refresh token")
    if not payload.get("jti"):
        raise jwt.InvalidTokenError("refresh token missing jti")
    return payload


def decode_token(token: str) -> dict[str, Any]:
    """Кері үйлесімдік: access токен ретінде тексеру."""
    return decode_access_token(token)


def decode_access_token_optional(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    token = token.strip()
    if not token:
        return None
    try:
        return decode_access_token(token)
    except jwt.PyJWTError:
        return None


def decode_token_optional(token: str | None) -> dict[str, Any] | None:
    return decode_access_token_optional(token)


def bearer_token_from_authorization(value: str | None) -> str | None:
    if not value:
        return None
    v = value.strip()
    if not v.lower().startswith("bearer "):
        return None
    return v[7:].strip() or None


def payload_scopes(payload: dict[str, Any]) -> list[str]:
    raw = payload.get("scopes")
    if raw is None:
        return []
    if isinstance(raw, str):
        return [raw] if raw else []
    if isinstance(raw, list):
        return [str(x) for x in raw if str(x)]
    return []


def auth_payload_from_request(request: Request) -> dict[str, Any] | None:
    tok = bearer_token_from_authorization(request.headers.get("Authorization"))
    return decode_access_token_optional(tok)


def platform_user_id_from_payload(payload: dict[str, Any]) -> str | None:
    """JWT ішіндегі тұрақты платформа uuid (sub немесе platform_user_id)."""
    claim = payload.get("platform_user_id")
    if isinstance(claim, str) and claim.strip():
        try:
            uuid.UUID(claim.strip())
            return claim.strip()
        except ValueError:
            pass
    sub = payload.get("sub")
    if isinstance(sub, str) and sub.strip():
        try:
            uuid.UUID(sub.strip())
            return sub.strip()
        except ValueError:
            pass
    return None


def claims_for_token_pair_from_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Refresh payload → жаңа жұп үшін claim-тер."""
    scopes = payload_scopes(payload)
    tid_raw = payload.get("telegram_user_id")
    tid_i: int | None
    try:
        tid_i = int(tid_raw) if tid_raw is not None else None
    except (TypeError, ValueError):
        tid_i = None
    pid_raw = payload.get("platform_user_id")
    pid_s = str(pid_raw).strip() if isinstance(pid_raw, str) and str(pid_raw).strip() else None
    sub = str(payload.get("sub") or "")
    return {
        "subject": sub,
        "scopes": scopes,
        "telegram_user_id": tid_i,
        "platform_user_id": pid_s,
        "apple_sub": payload.get("apple_sub") if isinstance(payload.get("apple_sub"), str) else None,
        "google_sub": payload.get("google_sub") if isinstance(payload.get("google_sub"), str) else None,
    }
