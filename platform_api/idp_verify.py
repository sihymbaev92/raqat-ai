# -*- coding: utf-8 -*-
"""Google id_token және Apple identity_token тексеру."""
from __future__ import annotations

import os
from typing import Any

import jwt
from jwt import PyJWKClient


def google_audiences() -> list[str]:
    raw = (os.getenv("RAQAT_GOOGLE_OAUTH_AUDIENCE") or "").strip()
    if raw:
        return [x.strip() for x in raw.split(",") if x.strip()]
    return []


def verify_google_id_token(raw_token: str) -> dict[str, Any]:
    """Қайтарады: {sub, email?}. Audience — RAQAT_GOOGLE_OAUTH_AUDIENCE (бір немесе үтірмен)."""
    from google.auth.transport import requests as grequests
    from google.oauth2 import id_token as google_id_token

    token = (raw_token or "").strip()
    if not token:
        raise ValueError("empty_token")

    audiences = google_audiences()
    if not audiences:
        raise RuntimeError("RAQAT_GOOGLE_OAUTH_AUDIENCE is not set (Google OAuth client id(s)).")

    req = grequests.Request()
    last_err: Exception | None = None
    for aud in audiences:
        try:
            info = google_id_token.verify_oauth2_token(token, req, audience=aud)
            sub = str(info.get("sub") or "").strip()
            if not sub:
                raise ValueError("missing_sub")
            out: dict[str, Any] = {"sub": sub}
            if info.get("email"):
                out["email"] = str(info["email"])
            return out
        except Exception as e:
            last_err = e
            continue
    raise ValueError(f"invalid_google_token: {last_err}")


def verify_apple_identity_token(raw_token: str) -> dict[str, Any]:
    """
    Native Sign in with Apple: audience = iOS bundle id (мысалы kz.raqat.app).
    RAQAT_APPLE_OAUTH_AUDIENCE — әдепкі: kz.raqat.app
    """
    token = (raw_token or "").strip()
    if not token:
        raise ValueError("empty_token")

    audience = (os.getenv("RAQAT_APPLE_OAUTH_AUDIENCE") or "kz.raqat.app").strip()
    jwks_url = "https://appleid.apple.com/auth/keys"
    jwks_client = PyJWKClient(jwks_url)
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    data = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience=audience,
        issuer="https://appleid.apple.com",
    )
    sub = str(data.get("sub") or "").strip()
    if not sub:
        raise ValueError("missing_sub")
    return {"sub": sub}
