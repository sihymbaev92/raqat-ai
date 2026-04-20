# -*- coding: utf-8 -*-
"""POST /api/v1/ai/* — Bot → API → Gemini (барлық AI сұраулары)."""
from __future__ import annotations

import base64

import time

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Literal

from ai_exact_cache import cache_get_reply, cache_set_reply
from ai_semantic_cache import cache_get_semantic, cache_set_semantic
from prometheus_metrics import observe_ai_chat
from ai_multimodal import analyze_halal_image, transcribe_voice, tts_to_payload
from ai_proxy import generate_ai_reply
from ai_rate_limit import require_ai_access_with_rate_limit
from db.governance_store import append_audit_event, append_usage_event
from db.platform_identity_chat import append_ai_exchange
from db_reader import resolve_db_path
from jwt_auth import auth_payload_from_request, platform_user_id_from_payload

router = APIRouter(prefix="/api/v1", tags=["ai"])


def _enqueue_or_503(task_name: str, payload: dict) -> dict:
    """Celery кезегі (RAQAT_QUEUE_BACKEND=celery, Redis broker)."""
    try:
        from app.infrastructure.queue import enqueue_task
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail={"error": "queue_unavailable", "reason": str(exc)},
        ) from exc
    q = enqueue_task(task_name, payload)
    if q.get("queued"):
        tid = q.get("task_id")
        return {
            "ok": True,
            "async": True,
            "task_id": tid,
            "poll_path": f"/api/v1/ai/task/{tid}",
        }
    raise HTTPException(
        status_code=503,
        detail={"error": "queue_unavailable", "reason": q.get("reason", "unknown")},
    )


@router.get("/ai/task/{task_id}")
def ai_task_status(
    task_id: str,
    _: None = Depends(require_ai_access_with_rate_limit),
):
    """Async тапсырма күйі (Celery result backend)."""
    try:
        from celery.result import AsyncResult

        from celery_app import app as celery_worker_app
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="celery_unavailable") from exc
    r = AsyncResult(task_id, app=celery_worker_app)
    out: dict = {
        "ok": True,
        "task_id": task_id,
        "state": r.state,
        "ready": r.ready(),
    }
    if r.failed():
        err = r.result
        out["error"] = str(err) if err is not None else "failure"
    elif r.ready() and r.successful():
        out["result"] = r.result
    return out


def _log_ai_event(
    request: Request,
    route: str,
    *,
    prompt_chars: int | None = None,
    response_chars: int | None = None,
) -> None:
    pl = auth_payload_from_request(request)
    src = "jwt" if pl else "secret"
    pid = platform_user_id_from_payload(pl) if pl else None
    tid = None
    if pl and pl.get("telegram_user_id") is not None:
        try:
            tid = int(pl["telegram_user_id"])
        except (TypeError, ValueError):
            tid = None
    append_usage_event(
        str(resolve_db_path()),
        event_type="ai",
        route=route,
        source_auth=src,
        platform_user_id=pid,
        telegram_user_id=tid,
        units=1,
        prompt_chars=prompt_chars,
        response_chars=response_chars,
    )


class AiChatRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=12000)
    user_id: int | None = Field(None, description="Telegram user id")
    async_mode: bool = Field(default=False, description="Celery кезегіне (жауап GET /ai/task/{id})")
    detail_level: Literal["full", "quick"] = Field(
        default="full",
        description="quick — қысқа жауап (алдымен жылдам); full — толық талдау",
    )
    staged_pipeline: bool = Field(
        default=False,
        description="True — Raqat AI чат үшін Құран→хадис→іздеу; False — бір шақыру (халал т.б.)",
    )


@router.post("/ai/chat")
def ai_chat(
    request: Request,
    body: AiChatRequest,
    _: None = Depends(require_ai_access_with_rate_limit),
):
    pl = auth_payload_from_request(request)
    pid = platform_user_id_from_payload(pl) if pl else None
    tid = None
    if pl and pl.get("telegram_user_id") is not None:
        try:
            tid = int(pl["telegram_user_id"])
        except (TypeError, ValueError):
            tid = None

    if body.async_mode:
        src = "jwt" if pl else "secret"
        out = _enqueue_or_503(
            "raqat.ai.chat",
            {
                "prompt": body.prompt,
                "detail_level": body.detail_level,
                "staged_pipeline": body.staged_pipeline,
                "platform_user_id": str(pid) if pid else None,
                "telegram_user_id": tid,
                "source_auth": src,
            },
        )
        return {**out, "user_id": body.user_id}

    quick = body.detail_level == "quick"
    cache_prompt = f"quick:{body.prompt}" if quick else body.prompt

    cached = cache_get_reply(cache_prompt)
    cache_hit_exact = bool(cached and str(cached).strip())
    cache_hit_semantic = False
    if cache_hit_exact:
        text = str(cached).strip()
    else:
        sem = cache_get_semantic(cache_prompt)
        if sem and str(sem).strip():
            text = str(sem).strip()
            cache_hit_semantic = True
        else:
            t0 = time.perf_counter()
            text = generate_ai_reply(
                body.prompt,
                quick=quick,
                use_staged_pipeline=body.staged_pipeline,
            )
            observe_ai_chat(time.perf_counter() - t0)
            cache_set_reply(cache_prompt, text)
            cache_set_semantic(cache_prompt, text)

    cache_hit = cache_hit_exact or cache_hit_semantic

    if pid and not quick:
        append_ai_exchange(
            str(resolve_db_path()),
            pid,
            body.prompt,
            text,
            source="api",
        )
    src = "jwt" if pl else "secret"
    append_audit_event(
        str(resolve_db_path()),
        action="ai.chat",
        route="POST /api/v1/ai/chat",
        actor_type=src,
        platform_user_id=str(pid) if pid else None,
        telegram_user_id=tid,
        summary=(
            f"cache_hit={cache_hit};exact={cache_hit_exact};semantic={cache_hit_semantic};"
            f"prompt_chars={len(body.prompt)};reply_chars={len(text)}"
        ),
    )
    _log_ai_event(request, "POST /api/v1/ai/chat", prompt_chars=len(body.prompt), response_chars=len(text))
    return {
        "ok": True,
        "text": text,
        "user_id": body.user_id,
        "cached": cache_hit,
        "cached_exact": cache_hit_exact,
        "cached_semantic": cache_hit_semantic,
        "detail_level": body.detail_level,
    }


class AiAnalyzeImageRequest(BaseModel):
    image_b64: str = Field(..., min_length=8, max_length=25_000_000)
    mime_type: str = Field(default="image/jpeg", max_length=128)
    lang: str = Field(default="kk", max_length=8)
    # Қосымша нұсқау (қолданба): құрылымды талдау.
    prompt: str | None = Field(None, max_length=12_000)
    async_mode: bool = Field(default=False)


@router.post("/ai/analyze-image")
def ai_analyze_image(
    request: Request,
    body: AiAnalyzeImageRequest,
    _: None = Depends(require_ai_access_with_rate_limit),
):
    if body.async_mode:
        return _enqueue_or_503(
            "raqat.ai.analyze_image",
            {
                "image_b64": body.image_b64,
                "mime_type": body.mime_type,
                "lang": body.lang,
                "prompt": body.prompt,
            },
        )
    try:
        raw = base64.standard_b64decode(body.image_b64.encode("ascii"))
    except Exception:
        return {"ok": False, "text": "", "error": "invalid_base64"}
    text = analyze_halal_image(raw, body.mime_type, body.lang, body.prompt)
    if text:
        _log_ai_event(
            request,
            "POST /api/v1/ai/analyze-image",
            prompt_chars=len(body.image_b64),
            response_chars=len(text),
        )
    return {"ok": bool(text), "text": text}


class AiTranscribeRequest(BaseModel):
    audio_b64: str = Field(..., min_length=8, max_length=25_000_000)
    mime_type: str = Field(default="audio/ogg", max_length=128)
    preferred_lang: str | None = Field(None, max_length=16)
    async_mode: bool = Field(default=False)


@router.post("/ai/transcribe-voice")
def ai_transcribe_voice(
    request: Request,
    body: AiTranscribeRequest,
    _: None = Depends(require_ai_access_with_rate_limit),
):
    if body.async_mode:
        return _enqueue_or_503(
            "raqat.ai.transcribe",
            {
                "audio_b64": body.audio_b64,
                "mime_type": body.mime_type,
                "preferred_lang": body.preferred_lang,
            },
        )
    try:
        raw = base64.standard_b64decode(body.audio_b64.encode("ascii"))
    except Exception:
        return {"ok": False, "text": "", "error": "invalid_base64"}
    text = transcribe_voice(raw, body.mime_type, body.preferred_lang)
    if text:
        _log_ai_event(
            request,
            "POST /api/v1/ai/transcribe-voice",
            prompt_chars=len(body.audio_b64),
            response_chars=len(text),
        )
    return {"ok": bool(text), "text": text}


class AiTtsRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    lang: str = Field(default="kk", max_length=16)
    async_mode: bool = Field(default=False)


@router.post("/ai/tts")
def ai_tts(
    request: Request,
    body: AiTtsRequest,
    _: None = Depends(require_ai_access_with_rate_limit),
):
    if body.async_mode:
        return _enqueue_or_503(
            "raqat.ai.tts",
            {"text": body.text, "lang": body.lang},
        )
    payload = tts_to_payload(body.text, body.lang)
    if not payload:
        return {"ok": False, "error": "tts_unavailable"}
    b64 = payload.get("audio_b64") or ""
    _log_ai_event(
        request,
        "POST /api/v1/ai/tts",
        prompt_chars=len(body.text),
        response_chars=len(b64) if isinstance(b64, str) else None,
    )
    return {"ok": True, **payload}
