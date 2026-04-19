# -*- coding: utf-8 -*-
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from db.governance_store import consume_refresh_jti_once, prune_expired_revocations
from jwt_auth import claims_for_token_pair_from_payload, decode_refresh_token


class RefreshRotationError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def rotate_refresh_token_once(db_path: str, refresh_token: str, default_scopes: list[str]) -> dict[str, Any]:
    """
    Decode + atomically consume refresh token JTI.
    Returns normalized claims bundle used to mint next token pair.
    """
    try:
        payload = decode_refresh_token((refresh_token or "").strip())
    except Exception as exc:
        raise RefreshRotationError("INVALID_REFRESH_TOKEN", "Refresh token invalid or expired.") from exc

    jti = str(payload.get("jti") or "")
    prune_expired_revocations(db_path)
    exp = payload.get("exp")
    if isinstance(exp, (int, float)):
        exp_iso = datetime.fromtimestamp(int(exp), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    else:
        exp_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    if not consume_refresh_jti_once(db_path, jti, exp_iso):
        raise RefreshRotationError("REFRESH_REVOKED", "Refresh token was rotated or revoked.")

    claims = claims_for_token_pair_from_payload(payload)
    scopes = claims["scopes"] if claims["scopes"] else list(default_scopes)
    return {"claims": claims, "scopes": scopes}
