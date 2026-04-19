from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.response import success_response
from auth_credentials import auth_login_configured, verify_password
from db_reader import resolve_db_path
from jwt_auth import (
    create_token_pair,
    jwt_secret,
)
from refresh_rotation import RefreshRotationError, rotate_refresh_token_once

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginBody(BaseModel):
    username: str = Field(..., min_length=1, max_length=128)
    password: str = Field(..., min_length=1, max_length=256)


class RefreshBody(BaseModel):
    refresh_token: str = Field(..., min_length=24, max_length=8192)


DEFAULT_BOOTSTRAP_SCOPES = ["ai", "content", "user"]


@router.post("/login")
def login(body: LoginBody) -> dict:
    if not jwt_secret():
        raise HTTPException(status_code=503, detail="JWT is not configured.")
    if not auth_login_configured():
        raise HTTPException(status_code=503, detail="Auth credentials are not configured.")
    if not verify_password(body.username, body.password):
        raise HTTPException(status_code=401, detail="Wrong username or password.")
    pair = create_token_pair(subject=body.username.strip(), scopes=list(DEFAULT_BOOTSTRAP_SCOPES))
    return success_response({"token_type": "bearer", **pair, "scopes": list(DEFAULT_BOOTSTRAP_SCOPES)})


@router.post("/refresh")
def refresh(body: RefreshBody) -> dict:
    db_path = str(resolve_db_path())
    try:
        rotated = rotate_refresh_token_once(db_path, body.refresh_token, list(DEFAULT_BOOTSTRAP_SCOPES))
    except RefreshRotationError as e:
        raise HTTPException(status_code=401, detail=e.message) from None
    claims = rotated["claims"]
    scopes = rotated["scopes"]
    pair = create_token_pair(
        subject=claims["subject"],
        scopes=scopes,
        telegram_user_id=claims["telegram_user_id"],
        platform_user_id=claims["platform_user_id"],
        apple_sub=claims.get("apple_sub"),
        google_sub=claims.get("google_sub"),
    )
    return success_response(
        {
            "token_type": "bearer",
            **pair,
            "scopes": scopes,
            "platform_user_id": claims["platform_user_id"],
            "telegram_user_id": claims["telegram_user_id"],
        }
    )

