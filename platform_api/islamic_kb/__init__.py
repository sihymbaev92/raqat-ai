# -*- coding: utf-8 -*-
"""Muftyat.kz / Fatua.kz — индекстелген исламдық білім базасы (RAG)."""

from islamic_kb.rag import build_islamic_kb_context
from islamic_kb.search import (
    list_islamic_kb_documents,
    search_islamic_kb,
    search_islamic_kb_articles,
)

__all__ = [
    "build_islamic_kb_context",
    "search_islamic_kb",
    "search_islamic_kb_articles",
    "list_islamic_kb_documents",
]
