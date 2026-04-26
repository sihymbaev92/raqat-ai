# -*- coding: utf-8 -*-
"""platform_api шақырулары үшін бір httpx.AsyncClient (keep-alive, шектеулер)."""
from __future__ import annotations

import asyncio
import logging
from typing import Optional

import httpx

from platform_gateway import bot_sync_enabled, platform_content_enabled

logger = logging.getLogger("raqat_ai")

_client: Optional[httpx.AsyncClient] = None
_lock: Optional[asyncio.Lock] = None


async def get_platform_http() -> Optional[httpx.AsyncClient]:
    if not (platform_content_enabled() or bot_sync_enabled()):
        return None
    global _client, _lock
    if _lock is None:
        _lock = asyncio.Lock()
    async with _lock:
        if _client is None:
            _client = httpx.AsyncClient(
                timeout=httpx.Timeout(45.0, connect=12.0),
                limits=httpx.Limits(max_keepalive_connections=16, max_connections=32),
                follow_redirects=True,
            )
            logger.info("platform_http: shared AsyncClient ready")
        return _client


async def aclose_platform_http() -> None:
    global _client, _lock
    if _lock is None:
        return
    async with _lock:
        if _client is not None:
            await _client.aclose()
            _client = None
            logger.info("platform_http: AsyncClient closed")
