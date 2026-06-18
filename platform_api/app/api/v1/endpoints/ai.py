from __future__ import annotations

from hashlib import md5

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.response import success_response
from app.infrastructure.cache import cache_get_json, cache_set_json
from app.infrastructure.queue import enqueue_task
from ai_safety_moderation import moderate_ai_prompt

router = APIRouter(prefix="/ai", tags=["ai"])


class ChatBody(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    async_mode: bool = Field(default=False)


@router.post("/chat")
def ai_chat(body: ChatBody) -> dict:
    prompt = body.prompt.strip()
    safety = moderate_ai_prompt(prompt)
    if not safety.allowed:
        return success_response(
            {
                "mode": "safety-blocked",
                "ok": False,
                "error": "safety_blocked",
                "text": "",
                "detail": {
                    "message_kk": safety.message_kk,
                    "risk_level": safety.risk_level,
                    "categories": list(safety.categories),
                },
                "pipeline": ["intent", "safety", "audit"],
                "safety": {
                    "risk_level": safety.risk_level,
                    "categories": list(safety.categories),
                },
            }
        )
    key = "raqat:ai:chat:" + md5(prompt.encode("utf-8")).hexdigest()
    cached = cache_get_json(key)
    if cached:
        return success_response({"mode": "cache", **cached})

    if body.async_mode:
        queued = enqueue_task("raqat.ai.chat", {"prompt": prompt})
        if queued.get("queued"):
            return success_response(
                {
                    "mode": "queued",
                    "task_id": queued.get("task_id"),
                    "status": "accepted",
                    "pipeline": ["intent", "retrieval", "reasoning", "safety", "audit"],
                }
            )

    # Graceful fallback: keep the API response user-facing when queue/AI is unavailable.
    out = {
        "mode": "sync-fallback",
        "answer": (
            "AI қызметі қазір жауап бере алмады. Құран, хадис және ресми дереккөз бөлімдері "
            "қолжетімді; сұрағыңызды сәл кейін қайта жіберіңіз."
        ),
        "pipeline": ["intent", "retrieval", "reasoning", "safety", "audit"],
        "safety": {"risk_level": "low", "disclaimer": "Ақпараттық жауап."},
    }
    cache_set_json(key, out, ttl_seconds=45)
    return success_response(out)

