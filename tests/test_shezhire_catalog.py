# -*- coding: utf-8 -*-
"""Шежіре каталогы — қайталанусыз ағаш."""
from __future__ import annotations

from collections import defaultdict

from db.shezhire_catalog_builder import build_bundled_snapshot


def test_bundled_no_duplicate_slugs():
    snap = build_bundled_snapshot()
    slugs = [n["slug"] for n in snap["nodes"]]
    assert len(slugs) == len(set(slugs))


def test_bundled_unique_sibling_names():
    snap = build_bundled_snapshot()
    by_parent: dict[str | None, dict[str, str]] = defaultdict(dict)
    for n in snap["nodes"]:
        crumbs = n.get("breadcrumbs") or []
        parent = crumbs[-2] if len(crumbs) >= 2 else None
        name = n["name_kk"]
        assert name not in by_parent[parent], (parent, name, by_parent[parent][name], n["slug"])
        by_parent[parent][name] = n["slug"]


def test_person_clan_exists():
    snap = build_bundled_snapshot()
    clan_slugs = {n["slug"] for n in snap["nodes"]}
    for p in snap["persons"]:
        assert p["clan_slug"] in clan_slugs, p["slug"]
