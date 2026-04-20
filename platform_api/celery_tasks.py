# -*- coding: utf-8 -*-
"""
Celery тапсырмалары: AI chat, сурет, TTS, дауыс — uvicorn ағынды босатады.
Worker: platform_api қалтасынан `celery -A celery_app worker --loglevel=info`
"""
from __future__ import annotations

import base64
import logging
import time

from celery import Task
from celery.exceptions import Retry

from celery_app import app

logger = logging.getLogger("raqat_celery_tasks")


class RaqatTask(Task):
    """Кезекті қателерде exponential backoff (retry)."""

    autoretry_for = (OSError, ConnectionError, TimeoutError, BrokenPipeError)
    retry_kwargs = {"max_retries": 5}
    retry_backoff = True
    retry_backoff_max = 600
    retry_jitter = True


def _maybe_retry_chat(task: Task, exc: BaseException) -> None:
    from ai_proxy import _is_transient_error

    if task.request.retries >= 5:
        return
    if _is_transient_error(exc) if isinstance(exc, Exception) else False:
        raise task.retry(exc=exc, countdown=min(600, 2 ** task.request.retries * 15))


@app.task(name="raqat.ai.chat", bind=True, base=RaqatTask)
def task_ai_chat(self, payload: dict) -> dict:
    prompt = (payload.get("prompt") or "").strip()
    if not prompt:
        return {"ok": False, "error": "empty_prompt"}
    quick = (payload.get("detail_level") or "full") == "quick"
    staged_pipeline = bool(payload.get("staged_pipeline"))
    cache_prompt = f"quick:{prompt}" if quick else prompt
    try:
        from ai_exact_cache import cache_get_reply, cache_set_reply
        from ai_proxy import generate_ai_reply
        from ai_semantic_cache import cache_get_semantic, cache_set_semantic
        from db.governance_store import append_audit_event, append_usage_event
        from db.platform_identity_chat import append_ai_exchange
        from db_reader import resolve_db_path
        from prometheus_metrics import observe_ai_chat

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
                    prompt,
                    quick=quick,
                    use_staged_pipeline=staged_pipeline,
                )
                observe_ai_chat(time.perf_counter() - t0)
                cache_set_reply(cache_prompt, text)
                cache_set_semantic(cache_prompt, text)

        cache_hit = cache_hit_exact or cache_hit_semantic

        db_path = str(resolve_db_path())
        pid = payload.get("platform_user_id")
        pid_s = str(pid).strip() if pid else None
        tid = payload.get("telegram_user_id")
        try:
            tid_i = int(tid) if tid is not None else None
        except (TypeError, ValueError):
            tid_i = None

        if pid_s and not quick:
            append_ai_exchange(db_path, pid_s, prompt, text, source="api")

        src_auth = (payload.get("source_auth") or "jwt").strip()[:32] or "jwt"
        append_usage_event(
            db_path,
            event_type="ai",
            route="POST /api/v1/ai/chat (async)",
            source_auth=src_auth,
            platform_user_id=pid_s,
            telegram_user_id=tid_i,
            units=1,
            prompt_chars=len(prompt),
            response_chars=len(text),
        )
        append_audit_event(
            db_path,
            action="ai.chat",
            route="celery:raqat.ai.chat",
            actor_type=src_auth,
            platform_user_id=pid_s,
            telegram_user_id=tid_i,
            summary=(
                f"cache_hit={cache_hit};exact={cache_hit_exact};semantic={cache_hit_semantic};"
                f"prompt_chars={len(prompt)};reply_chars={len(text)}"
            ),
        )
        return {
            "ok": True,
            "text": text,
            "cached": cache_hit,
            "cached_exact": cache_hit_exact,
            "cached_semantic": cache_hit_semantic,
        }
    except Retry:
        raise
    except Exception as exc:
        logger.exception("task_ai_chat failed")
        try:
            _maybe_retry_chat(self, exc)
        except Retry:
            raise
        return {"ok": False, "error": str(exc)}


@app.task(name="raqat.ai.analyze_image", bind=True, base=RaqatTask)
def task_analyze_image(self, payload: dict) -> dict:
    try:
        raw = base64.standard_b64decode((payload.get("image_b64") or "").encode("ascii"))
    except Exception:
        return {"ok": False, "error": "invalid_base64", "text": ""}
    try:
        from ai_multimodal import analyze_halal_image

        mime = (payload.get("mime_type") or "image/jpeg").strip() or "image/jpeg"
        lang = (payload.get("lang") or "kk").strip() or "kk"
        client_prompt = payload.get("prompt")
        text = analyze_halal_image(raw, mime, lang, client_prompt)
        return {"ok": bool(text), "text": text or ""}
    except Retry:
        raise
    except Exception as exc:
        logger.exception("task_analyze_image failed")
        try:
            _maybe_retry_chat(self, exc)
        except Retry:
            raise
        return {"ok": False, "error": str(exc), "text": ""}


@app.task(name="raqat.ai.tts", bind=True, base=RaqatTask)
def task_tts(self, payload: dict) -> dict:
    try:
        from ai_multimodal import tts_to_payload

        text = (payload.get("text") or "").strip()
        lang = (payload.get("lang") or "kk").strip() or "kk"
        out = tts_to_payload(text, lang)
        if not out:
            return {"ok": False, "error": "tts_unavailable"}
        return {"ok": True, **out}
    except Retry:
        raise
    except Exception as exc:
        logger.exception("task_tts failed")
        try:
            _maybe_retry_chat(self, exc)
        except Retry:
            raise
        return {"ok": False, "error": str(exc)}


@app.task(name="raqat.ai.transcribe", bind=True, base=RaqatTask)
def task_transcribe(self, payload: dict) -> dict:
    try:
        raw = base64.standard_b64decode((payload.get("audio_b64") or "").encode("ascii"))
    except Exception:
        return {"ok": False, "error": "invalid_base64", "text": ""}
    try:
        from ai_multimodal import transcribe_voice

        mime = (payload.get("mime_type") or "audio/ogg").strip() or "audio/ogg"
        pref = payload.get("preferred_lang")
        text = transcribe_voice(raw, mime, pref)
        return {"ok": bool(text), "text": text or ""}
    except Retry:
        raise
    except Exception as exc:
        logger.exception("task_transcribe failed")
        try:
            _maybe_retry_chat(self, exc)
        except Retry:
            raise
        return {"ok": False, "error": str(exc), "text": ""}
