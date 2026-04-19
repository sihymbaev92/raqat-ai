# -*- coding: utf-8 -*-
"""Auth: login, Telegram link, refresh (JWT access + refresh)."""
from __future__ import annotations

import os
import uuid as _uuid_mod

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from auth_credentials import auth_login_configured, verify_password
from db.oauth_login import ensure_platform_user_for_oauth
from db.phone_auth import (
    create_otp_challenge,
    ensure_platform_user_for_phone,
    normalize_phone_e164,
    verify_otp_and_consume,
)
from db.platform_identity_chat import (
    ensure_platform_user_for_telegram,
    link_telegram_to_existing_platform_user,
)
from db.password_login import ensure_platform_user_for_password_username
from db_reader import resolve_db_path
from jwt_auth import (
    create_token_pair,
    decode_access_token,
    jwt_secret,
    payload_scopes,
    platform_user_id_from_payload,
)
from idp_verify import verify_apple_identity_token, verify_google_id_token
from refresh_rotation import RefreshRotationError, rotate_refresh_token_once
from sms_twilio import send_twilio_sms, twilio_sms_configured

router = APIRouter(prefix="/api/v1", tags=["auth"])

link_bearer = HTTPBearer(auto_error=False)


class LoginBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=128)
    password: str = Field(..., min_length=1, max_length=256)


class LinkTelegramBody(BaseModel):
    telegram_user_id: int = Field(..., ge=1, le=9223372036854775807)


class RefreshBody(BaseModel):
    refresh_token: str = Field(..., min_length=24, max_length=8192)


class GoogleOAuthBody(BaseModel):
    id_token: str = Field(..., min_length=10, max_length=12000)


class AppleOAuthBody(BaseModel):
    identity_token: str = Field(..., min_length=10, max_length=12000)


class PhoneStartBody(BaseModel):
    phone_e164: str = Field(..., min_length=10, max_length=24)


class PhoneVerifyBody(BaseModel):
    challenge_id: str = Field(..., min_length=8, max_length=80)
    code: str = Field(..., min_length=4, max_length=10)


DEFAULT_BOOTSTRAP_SCOPES = ["ai", "content", "user"]


def _token_bundle_response(
    *,
    pair: dict,
    scopes: list[str],
    platform_user_id: str | None = None,
    telegram_user_id: int | None = None,
) -> dict:
    return {
        "ok": True,
        "token_type": "bearer",
        "access_token": pair["access_token"],
        "refresh_token": pair["refresh_token"],
        "expires_in": pair["expires_in"],
        "refresh_expires_in": pair["refresh_expires_in"],
        "scopes": scopes,
        **({"platform_user_id": platform_user_id} if platform_user_id else {}),
        **({"telegram_user_id": telegram_user_id} if telegram_user_id is not None else {}),
    }


@router.post("/auth/login")
def auth_login(body: LoginBody):
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "JWT_NOT_CONFIGURED",
                "message": "Set RAQAT_JWT_SECRET (min 32 chars) on the API server.",
            },
        )
    if not auth_login_configured():
        raise HTTPException(
            status_code=503,
            detail={
                "code": "AUTH_LOGIN_NOT_CONFIGURED",
                "message": "Set RAQAT_AUTH_PASSWORD_BCRYPT or RAQAT_AUTH_PASSWORD (dev only).",
            },
        )
    if not verify_password(body.username, body.password):
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_CREDENTIALS", "message": "Wrong username or password."},
        )
    try:
        platform_user_id = ensure_platform_user_for_password_username(body.username)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "IDENTITY_ISSUE_FAILED", "message": str(e)[:400]},
        ) from e
    try:
        pair = create_token_pair(
            subject=platform_user_id,
            scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
            platform_user_id=platform_user_id,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail={"code": "JWT_ISSUE_FAILED", "message": str(e)}) from e
    return _token_bundle_response(
        pair=pair,
        scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
        platform_user_id=platform_user_id,
    )


@router.post("/auth/refresh")
def auth_refresh(body: RefreshBody):
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={"code": "JWT_NOT_CONFIGURED", "message": "Set RAQAT_JWT_SECRET (min 32 chars)."},
        )
    db_path = str(resolve_db_path())
    try:
        rotated = rotate_refresh_token_once(db_path, body.refresh_token, list(DEFAULT_BOOTSTRAP_SCOPES))
    except RefreshRotationError as e:
        raise HTTPException(
            status_code=401,
            detail={"code": e.code, "message": e.message},
        ) from None
    c = rotated["claims"]
    scopes = rotated["scopes"]
    from auth_credentials import expected_username

    subj = str(c.get("subject") or "").strip()
    tid = c.get("telegram_user_id")
    tid_i: int | None
    try:
        tid_i = int(tid) if tid is not None else None
    except (TypeError, ValueError):
        tid_i = None

    pid_s: str | None = None
    raw_pid = c.get("platform_user_id")
    if isinstance(raw_pid, str) and raw_pid.strip():
        try:
            _uuid_mod.UUID(raw_pid.strip())
            pid_s = raw_pid.strip()
        except ValueError:
            pid_s = None
    if not pid_s and subj:
        try:
            _uuid_mod.UUID(subj)
            pid_s = subj
        except ValueError:
            if subj == expected_username().strip():
                try:
                    pid_s = ensure_platform_user_for_password_username(subj)
                except Exception:
                    pid_s = None

    final_sub = pid_s or subj
    try:
        pair = create_token_pair(
            subject=final_sub,
            scopes=scopes,
            telegram_user_id=tid_i,
            platform_user_id=pid_s,
            apple_sub=c.get("apple_sub") if isinstance(c.get("apple_sub"), str) else None,
            google_sub=c.get("google_sub") if isinstance(c.get("google_sub"), str) else None,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail={"code": "JWT_ISSUE_FAILED", "message": str(e)}) from e
    return _token_bundle_response(
        pair=pair,
        scopes=scopes,
        platform_user_id=pid_s,
        telegram_user_id=tid_i,
    )


@router.post("/auth/link/telegram")
def auth_link_telegram(
    request: Request,
    body: LinkTelegramBody,
    creds: HTTPAuthorizationCredentials | None = Depends(link_bearer),
):
    """
    (1) Бот: `X-Raqat-Bot-Link-Secret` + `telegram_user_id` → access+refresh (sub = platform uuid).
    (2) Клиент: Bearer **access** + body → tg байланысы, жаңа жұп.
    """
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={"code": "JWT_NOT_CONFIGURED", "message": "Set RAQAT_JWT_SECRET (min 32 chars)."},
        )
    db_path = str(resolve_db_path())
    expected_link = (os.getenv("RAQAT_BOT_LINK_SECRET") or "").strip()
    bot_hdr = (request.headers.get("X-Raqat-Bot-Link-Secret") or "").strip()

    if bot_hdr:
        if not expected_link:
            raise HTTPException(
                status_code=503,
                detail={"code": "LINK_SECRET_NOT_CONFIGURED", "message": "RAQAT_BOT_LINK_SECRET not set."},
            )
        if bot_hdr != expected_link:
            raise HTTPException(
                status_code=401,
                detail={"code": "INVALID_BOT_LINK_SECRET", "message": "Wrong X-Raqat-Bot-Link-Secret."},
            )
        try:
            pid = ensure_platform_user_for_telegram(db_path, body.telegram_user_id)
            pair = create_token_pair(
                subject=pid,
                scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
                telegram_user_id=body.telegram_user_id,
                platform_user_id=pid,
            )
        except RuntimeError as e:
            raise HTTPException(status_code=503, detail={"code": "LINK_FAILED", "message": str(e)}) from e
        return _token_bundle_response(
            pair=pair,
            scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
            platform_user_id=pid,
            telegram_user_id=body.telegram_user_id,
        )

    if not creds or (creds.scheme or "").lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail={
                "code": "UNAUTHORIZED",
                "message": "Send X-Raqat-Bot-Link-Secret (bot mint) or Authorization Bearer access token (client link).",
            },
        )
    try:
        payload = decode_access_token(creds.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail={"code": "INVALID_TOKEN", "message": "Access JWT invalid or expired."}) from None
    pid = platform_user_id_from_payload(payload)
    if not pid:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "SUB_NOT_PLATFORM_UUID",
                "message": "Bearer access token sub must be a platform_user_id (uuid).",
            },
        )
    try:
        link_telegram_to_existing_platform_user(db_path, pid, body.telegram_user_id)
    except ValueError as e:
        code = str(e)
        if code == "telegram_already_linked":
            raise HTTPException(
                status_code=409,
                detail={"code": "TELEGRAM_ALREADY_LINKED", "message": "This Telegram id is linked to another platform user."},
            ) from e
        if code == "platform_already_has_telegram":
            raise HTTPException(
                status_code=409,
                detail={"code": "PLATFORM_ALREADY_HAS_TELEGRAM", "message": "This platform user already has a different Telegram id."},
            ) from e
        raise HTTPException(status_code=400, detail={"code": "LINK_FAILED", "message": code}) from e
    scopes = payload_scopes(payload) or list(DEFAULT_BOOTSTRAP_SCOPES)
    try:
        pair = create_token_pair(
            subject=pid,
            scopes=scopes,
            telegram_user_id=body.telegram_user_id,
            platform_user_id=pid,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail={"code": "JWT_ISSUE_FAILED", "message": str(e)}) from e
    return _token_bundle_response(
        pair=pair,
        scopes=scopes,
        platform_user_id=pid,
        telegram_user_id=body.telegram_user_id,
    )


@router.post("/auth/oauth/google")
def auth_oauth_google(body: GoogleOAuthBody):
    """Google Sign-In id_token → JWT (platform_user_id). RAQAT_GOOGLE_OAUTH_AUDIENCE қажет."""
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={"code": "JWT_NOT_CONFIGURED", "message": "Set RAQAT_JWT_SECRET (min 32 chars)."},
        )
    try:
        g = verify_google_id_token(body.id_token)
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "GOOGLE_OAUTH_NOT_CONFIGURED", "message": str(e)},
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_GOOGLE_TOKEN", "message": str(e)},
        ) from e
    sub = str(g.get("sub") or "")
    try:
        pid = ensure_platform_user_for_oauth("google", sub)
        pair = create_token_pair(
            subject=pid,
            scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
            platform_user_id=pid,
            google_sub=sub,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "IDENTITY_ISSUE_FAILED", "message": str(e)[:400]},
        ) from e
    return _token_bundle_response(pair=pair, scopes=list(DEFAULT_BOOTSTRAP_SCOPES), platform_user_id=pid)


@router.post("/auth/oauth/apple")
def auth_oauth_apple(body: AppleOAuthBody):
    """Sign in with Apple identity_token → JWT."""
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={"code": "JWT_NOT_CONFIGURED", "message": "Set RAQAT_JWT_SECRET (min 32 chars)."},
        )
    try:
        a = verify_apple_identity_token(body.identity_token)
    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_APPLE_TOKEN", "message": str(e)},
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail={"code": "INVALID_APPLE_TOKEN", "message": str(e)[:300]},
        ) from e
    sub = str(a.get("sub") or "")
    try:
        pid = ensure_platform_user_for_oauth("apple", sub)
        pair = create_token_pair(
            subject=pid,
            scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
            platform_user_id=pid,
            apple_sub=sub,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "IDENTITY_ISSUE_FAILED", "message": str(e)[:400]},
        ) from e
    return _token_bundle_response(pair=pair, scopes=list(DEFAULT_BOOTSTRAP_SCOPES), platform_user_id=pid)


@router.post("/auth/phone/start")
def auth_phone_start(body: PhoneStartBody):
    """SMS OTP жіберу (Twilio) немесе dev режимде кодты жауапқа қосу."""
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={"code": "JWT_NOT_CONFIGURED", "message": "Set RAQAT_JWT_SECRET (min 32 chars)."},
        )
    try:
        phone = normalize_phone_e164(body.phone_e164)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_PHONE", "message": "Use E.164 format, e.g. +77001234567."},
        ) from None

    dev_mode = (os.getenv("RAQAT_PHONE_OTP_DEV") or "").strip() in ("1", "true", "yes")
    if not twilio_sms_configured() and not dev_mode:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "SMS_NOT_CONFIGURED",
                "message": "Configure Twilio (TWILIO_*) or set RAQAT_PHONE_OTP_DEV=1 for development.",
            },
        )

    try:
        challenge_id, plain_code = create_otp_challenge(phone)
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "OTP_SECRET_MISSING", "message": str(e)},
        ) from e
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "OTP_CREATE_FAILED", "message": str(e)[:400]},
        ) from e

    if twilio_sms_configured():
        try:
            send_twilio_sms(phone, f"RAQAT коды: {plain_code}")
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail={"code": "SMS_SEND_FAILED", "message": str(e)[:400]},
            ) from e

    out: dict = {"ok": True, "challenge_id": challenge_id}
    if dev_mode and not twilio_sms_configured():
        out["dev_otp"] = plain_code
    return out


@router.post("/auth/phone/verify")
def auth_phone_verify(body: PhoneVerifyBody):
    if not jwt_secret():
        raise HTTPException(
            status_code=503,
            detail={"code": "JWT_NOT_CONFIGURED", "message": "Set RAQAT_JWT_SECRET (min 32 chars)."},
        )
    try:
        phone = verify_otp_and_consume(body.challenge_id, body.code)
    except ValueError as e:
        code = str(e)
        if code in ("otp_expired", "wrong_code", "unknown_challenge"):
            raise HTTPException(
                status_code=401,
                detail={"code": code.upper(), "message": "Invalid or expired code."},
            ) from e
        raise HTTPException(
            status_code=400,
            detail={"code": "VERIFY_FAILED", "message": code},
        ) from e

    try:
        pid = ensure_platform_user_for_phone(phone)
        pair = create_token_pair(
            subject=pid,
            scopes=list(DEFAULT_BOOTSTRAP_SCOPES),
            platform_user_id=pid,
        )
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"code": "IDENTITY_ISSUE_FAILED", "message": str(e)[:400]},
        ) from e
    return _token_bundle_response(pair=pair, scopes=list(DEFAULT_BOOTSTRAP_SCOPES), platform_user_id=pid)
