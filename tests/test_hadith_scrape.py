# -*- coding: utf-8 -*-
from __future__ import annotations

import sys
from pathlib import Path

import pytest

pytest.importorskip("httpx")

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from hadith_scrape.clean import html_to_plain
from hadith_scrape.extract import extract_from_html, split_hadith_blocks

SAMPLE = """
1. Хадис:
#### Арабша мәтіні:
قَالَ رَسُولُ اللَّهِ
Қазақша мағынасы:
Пайғамбар (с.а.у.) былай деген.
Риуаят etti: Имам Бухари
"""


def test_split_blocks():
    blocks = split_hadith_blocks(SAMPLE)
    assert len(blocks) >= 1


def test_extract_from_html_minimal():
    html = f"<html><body><article>{SAMPLE}</article></body></html>"
    rows = extract_from_html(
        html,
        source_url="https://islam.kz/kk/articles/test/",
        source_site="islam",
        page_title="Test",
    )
    assert len(rows) >= 1
    assert rows[0].source_url.startswith("https://islam.kz")


def test_html_to_plain_strips_tags():
    plain = html_to_plain("<p>Хадис <b>мағынасы</b></p><script>x</script>")
    assert "Хадис" in plain
    assert "<" not in plain
