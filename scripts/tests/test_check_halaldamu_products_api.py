"""Unit tests for halaldamu products monitor helpers."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))

from check_halaldamu_products_api import _items_total  # noqa: E402


def test_items_total_from_payload():
    payload = {"success": True, "items": [{"id": 1}], "total": 42}
    assert _items_total(payload) == (1, 42)


def test_items_total_empty():
    assert _items_total({"success": True, "items": [], "total": 0}) == (0, 0)
    assert _items_total(None) == (0, 0)
