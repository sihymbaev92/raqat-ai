# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from ai_qa_sources import (  # noqa: E402
    fetch_qa_sources_context,
    html_to_plain_text,
    parse_qa_source_urls,
)


def test_html_to_plain_text_strips_tags():
    raw = "<html><script>x</script><p>А &amp; B</p></html>"
    t = html_to_plain_text(raw)
    assert "script" not in t.lower()
    assert "А & B" in t or "А" in t


def test_parse_qa_source_urls_respects_max(monkeypatch):
    monkeypatch.setenv(
        "RAQAT_AI_QA_SOURCE_URLS",
        "https://a.example/kk,https://b.example/ru,https://c.example/extra",
    )
    monkeypatch.setenv("RAQAT_AI_QA_SOURCE_MAX_URLS", "2")
    u = parse_qa_source_urls()
    assert len(u) == 2
    assert u[0].startswith("https://a.")


def test_fetch_returns_empty_without_env(monkeypatch):
    monkeypatch.delenv("RAQAT_AI_QA_SOURCE_URLS", raising=False)
    assert fetch_qa_sources_context() == ""


def test_fetch_uses_cache(monkeypatch):
    monkeypatch.setenv("RAQAT_AI_QA_SOURCE_URLS", "https://example.com/")
    monkeypatch.setenv("RAQAT_AI_QA_SOURCE_CACHE_SEC", "3600")
    calls = {"n": 0}

    class FakeResp:
        status_code = 200
        text = "<title>FAQ</title><body><p>Жауап мәтіні</p></body>"

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def get(self, url: str):
            calls["n"] += 1
            return FakeResp()

    import ai_qa_sources as mod

    mod._CACHE.clear()

    import httpx

    monkeypatch.setattr(httpx, "Client", FakeClient)

    a = fetch_qa_sources_context()
    b = fetch_qa_sources_context()
    assert "example.com" in a
    assert calls["n"] == 1
    assert b == a
