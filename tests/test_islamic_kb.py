# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
from pathlib import Path

import pytest

API = Path(__file__).resolve().parents[1] / "platform_api"
if str(API) not in sys.path:
    sys.path.insert(0, str(API))

from islamic_kb.chunking import chunk_plain_text  # noqa: E402
from islamic_kb.db import connect, ensure_db  # noqa: E402
from islamic_kb.ingest import (  # noqa: E402
    _looks_like_article,
    _max_listing_page,
    ingest_url,
)
from islamic_kb.rag import build_islamic_kb_context  # noqa: E402
from islamic_kb.excerpt import make_excerpt  # noqa: E402
from islamic_kb.html_cleaner import extract_article_image_url  # noqa: E402
from islamic_kb.search import search_islamic_kb, search_islamic_kb_articles  # noqa: E402


@pytest.fixture()
def kb_db(tmp_path, monkeypatch):
    db = tmp_path / "test_kb.sqlite3"
    monkeypatch.setenv("RAQAT_ISLAMIC_KB_DB_PATH", str(db))
    monkeypatch.setenv("RAQAT_ISLAMIC_KB_ENABLED", "1")
    ensure_db(db)
    yield db


def test_max_listing_page_from_html():
    html = '<a href="?page=2&category_id=0">2</a><a href="?page=10">10</a>'
    assert _max_listing_page(html) == 10


def test_looks_like_article_muftyat():
    assert _looks_like_article(
        "https://www.muftyat.kz/kk/articles/islam/2025-01-01/12345-test/",
        "muftyat",
    )
    assert _looks_like_article(
        "https://www.muftyat.kz/kk/qa/qa-namaz/2025-02-04/45997-mesht/",
        "muftyat",
    )
    assert not _looks_like_article("https://www.muftyat.kz/kk/articles", "muftyat")


def test_muftyat_listing_page_url():
    from islamic_kb.ingest import _muftyat_listing_page_url

    assert _muftyat_listing_page_url("https://www.muftyat.kz/kk/articles", 1) == (
        "https://www.muftyat.kz/kk/articles/"
    )
    assert _muftyat_listing_page_url("https://www.muftyat.kz/kk/news/", 3) == (
        "https://www.muftyat.kz/kk/news/?page=3"
    )


def test_looks_like_article_fatua_qa():
    assert _looks_like_article(
        "https://fatua.kz/kk/qa/read/2025-09-02/1061-bilyard",
        "fatua",
    )
    assert not _looks_like_article("https://fatua.kz/kk/qa", "fatua")


def test_chunk_plain_text_splits_long():
    text = "абзац. " * 400
    chunks = chunk_plain_text(text, max_chars=200)
    assert len(chunks) >= 2
    assert all(len(c) <= 200 for c in chunks)


def test_extract_article_image_url_og_and_upload():
    html = """
    <html><head>
      <meta property="og:image" content="https://fatua.kz/media/upload/articles/x.png"/>
    </head><body><article><img src="/media/upload/articles/y.png"/></article></body></html>
    """
    assert extract_article_image_url(html, "https://fatua.kz/kk/qa/read/test") == (
        "https://fatua.kz/media/upload/articles/x.png"
    )


def test_ingest_and_search(kb_db, monkeypatch):
    html = """
    <html><head><title>Намазда күлу</title>
    <meta property="og:image" content="https://fatua.kz/media/upload/articles/namaz.png"/>
    </head>
    <body><article><p>Намазда күлу харам деп саналады. Пәтуа мәтіні.</p></article></body></html>
    """
    monkeypatch.setattr(
        "islamic_kb.ingest.fetch_url",
        lambda url, timeout=None: html,
    )
    res = ingest_url("https://fatua.kz/test/namaz-kulu", source_site="fatua")
    assert res.status in ("indexed", "unchanged")
    with connect(kb_db) as conn:
        row = conn.execute(
            "SELECT image_url FROM islamic_kb_documents WHERE canonical_url = ?",
            ("https://fatua.kz/test/namaz-kulu",),
        ).fetchone()
        assert row["image_url"] == "https://fatua.kz/media/upload/articles/namaz.png"
    hits = search_islamic_kb("намазда күлу")
    assert hits
    assert "күлу" in hits[0].text_plain.lower()


def test_make_excerpt_truncates():
    long = "сөз " * 200
    ex = make_excerpt(long, max_len=80)
    assert len(ex) <= 85
    assert ex.endswith("…")


def test_search_articles_dedupes_documents(kb_db, monkeypatch):
    html = """
    <html><head><title>Дәрет</title></head>
    <body><article><p>Дәрет алу намазға дайындық. Дәрет сүннеті.</p></article></body></html>
    """
    monkeypatch.setattr("islamic_kb.ingest.fetch_url", lambda url, timeout=None: html)
    ingest_url("https://fatua.kz/test/wudu", source_site="fatua")
    articles = search_islamic_kb_articles("дәрет", limit=5)
    assert articles
    assert articles[0].excerpt
    assert articles[0].source_label == "Fatua.kz"
    assert articles[0].url.startswith("https://")
    assert len(articles) == len({a.document_id for a in articles})


def test_build_context_returns_sources(kb_db, monkeypatch):
    html = """
    <html><head><title>Ораза</title></head>
    <body><main><p>Ораза ұстаушыға сауапты іс. Толық мәтін.</p></main></body></html>
    """
    monkeypatch.setattr("islamic_kb.ingest.fetch_url", lambda url, timeout=None: html)
    ingest_url("https://muftyat.kz/test/oraza", source_site="muftyat")
    ctx, sources = build_islamic_kb_context("Жаңа сұрақ: ораза туралы")
    assert "Muftyat" in ctx or "muftyat" in ctx.lower()
    assert sources and sources[0]["url"].startswith("https://")
