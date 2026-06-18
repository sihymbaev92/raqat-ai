# -*- coding: utf-8 -*-
"""Safe resized image proxy for mobile thumbnails."""
from __future__ import annotations

from io import BytesIO
import os
import time
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(prefix="/api/v1/image-proxy", tags=["image-proxy"])

_ALLOWED_HOSTS = {"halaldamu.kz", "www.halaldamu.kz"}
_ALLOWED_EXTS = (".jpg", ".jpeg", ".png", ".webp")
_MAX_UPSTREAM_BYTES = 6 * 1024 * 1024
_MAX_CACHE_ENTRIES = 300
_CACHE_TTL_SEC = 24 * 60 * 60
_CACHE: dict[str, tuple[float, bytes, str]] = {}


def _int_env(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw is None or not str(raw).strip():
        return default
    try:
        return int(str(raw).strip())
    except ValueError:
        return default


def validate_image_proxy_url(url: str) -> str:
    parsed = urlparse((url or "").strip())
    if parsed.scheme != "https":
        raise ValueError("https_required")
    host = (parsed.hostname or "").lower()
    if host not in _ALLOWED_HOSTS:
        raise ValueError("host_not_allowed")
    path = parsed.path or ""
    if not path.startswith("/wp-content/uploads/"):
        raise ValueError("path_not_allowed")
    if not path.lower().endswith(_ALLOWED_EXTS):
        raise ValueError("image_type_not_allowed")
    if parsed.username or parsed.password:
        raise ValueError("userinfo_not_allowed")
    return parsed.geturl()


def normalize_proxy_width(width: int) -> int:
    return max(64, min(640, int(width or 300)))


def _cache_key(url: str, width: int) -> str:
    return f"{width}:{url}"


def _evict_cache_if_needed() -> None:
    now = time.time()
    for key in [k for k, (expires_at, _, _) in _CACHE.items() if expires_at <= now]:
        del _CACHE[key]
    if len(_CACHE) <= _MAX_CACHE_ENTRIES:
        return
    ordered = sorted(_CACHE.items(), key=lambda item: item[1][0])
    for key, _ in ordered[: max(0, len(_CACHE) - _MAX_CACHE_ENTRIES)]:
        del _CACHE[key]


def clear_image_proxy_cache() -> int:
    n = len(_CACHE)
    _CACHE.clear()
    return n


def _load_pillow():
    try:
        from PIL import Image, ImageOps
    except ImportError as exc:
        raise RuntimeError("pillow_unavailable") from exc
    return Image, ImageOps


def _resize_image_bytes(body: bytes, width: int) -> tuple[bytes, str]:
    Image, ImageOps = _load_pillow()
    with Image.open(BytesIO(body)) as src:
        img = ImageOps.exif_transpose(src)
        if img.mode not in ("RGB", "RGBA"):
            img = img.convert("RGBA")
        if img.width > width:
            height = max(1, round(img.height * (width / img.width)))
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        if img.mode == "RGBA":
            out = BytesIO()
            img.save(out, format="PNG", optimize=True)
            return out.getvalue(), "image/png"
        out = BytesIO()
        img.convert("RGB").save(out, format="JPEG", quality=82, optimize=True, progressive=True)
        return out.getvalue(), "image/jpeg"


def fetch_resized_image(url: str, width: int) -> tuple[bytes, str, str]:
    safe_url = validate_image_proxy_url(url)
    safe_width = normalize_proxy_width(width)
    key = _cache_key(safe_url, safe_width)
    now = time.time()
    cached = _CACHE.get(key)
    if cached and cached[0] > now:
        return cached[1], cached[2], "hit"

    timeout = _int_env("RAQAT_IMAGE_PROXY_TIMEOUT_SEC", 12)
    headers = {
        "Accept": "image/avif,image/webp,image/png,image/jpeg,*/*;q=0.8",
        "User-Agent": "Raqat-Platform/1.0 (Image proxy; +https://raqat.ai)",
    }
    with httpx.Client(timeout=timeout, follow_redirects=False) as client:
        resp = client.get(safe_url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail={"error": "upstream_error", "status": resp.status_code})
    content_type = (resp.headers.get("content-type") or "").split(";", 1)[0].strip().lower()
    if content_type and not content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail={"error": "upstream_not_image"})
    body = resp.content or b""
    if not body:
        raise HTTPException(status_code=502, detail={"error": "upstream_empty"})
    if len(body) > _MAX_UPSTREAM_BYTES:
        raise HTTPException(status_code=413, detail={"error": "upstream_image_too_large"})

    try:
        resized, media_type = _resize_image_bytes(body, safe_width)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail={"error": str(exc)}) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail={"error": "image_decode_failed"}) from exc

    ttl = _int_env("RAQAT_IMAGE_PROXY_CACHE_TTL_SEC", _CACHE_TTL_SEC)
    _CACHE[key] = (now + ttl, resized, media_type)
    _evict_cache_if_needed()
    return resized, media_type, "miss"


@router.get("")
def image_proxy(
    url: str = Query(..., min_length=12),
    w: int = Query(300, ge=64, le=640),
) -> Response:
    try:
        body, media_type, cache_state = fetch_resized_image(url, w)
    except ValueError as exc:
        raise HTTPException(status_code=403, detail={"error": str(exc)}) from exc
    return Response(
        content=body,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            "X-Raqat-Image-Proxy-Cache": cache_state,
        },
    )
