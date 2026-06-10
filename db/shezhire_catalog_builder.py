# -*- coding: utf-8 -*-
"""Шежіре каталогын біріктіру — қайталанусыз, жүйелі ағаш."""
from __future__ import annotations

from typing import Any

from db.genealogy_seed import GenealogyClanDef, GENEALOGY_P0_CLANS
from db.shezhire_catalog_data import (
    CATALOG_CLAN_ROWS,
    CLAN_SLUG_ALIASES,
    DISPLAY_NAME_OVERRIDES,
    NODE_PATCHES,
    PARENT_SLUG_OVERRIDES,
    PERSON_EXTRA_ROWS,
    PERSON_SLUG_ALIASES,
)

ZHUZ_SLUGS = frozenset({"uly_zhuz", "orta_zhuz", "kishi_zhuz"})

CLAN_SOURCES_DEFAULT = [
    {"source_key": "shakarim_shezhire", "citation_note": None, "page_or_section": None},
    {"source_key": "mashhur_jusip_shezhire", "citation_note": None, "page_or_section": None},
]
BIO_SOURCE = {"source_key": "genealogy_public_figure_bio", "citation_note": None, "page_or_section": None}
NAS_ZHUZ_SOURCE = {
    "source_key": "nas_ethnography_kz",
    "citation_note": None,
    "page_or_section": "Жүз деңгейі",
}


def _canonical_slug(slug: str) -> str:
    return CLAN_SLUG_ALIASES.get(slug, slug)


def _clan_sources_for_slug(slug: str, zhuz_root: str | None) -> list[dict[str, Any]]:
    if slug in ZHUZ_SLUGS:
        return [dict(NAS_ZHUZ_SOURCE)]
    if zhuz_root == "orta_zhuz" and slug in {
        "argyn", "nayman", "kerey", "kongrat", "karakesek", "kuandyk", "tortuyl",
        "sadyr", "bura", "karke", "kozhaman", "kobenshi", "kurak", "tortuyl_nayman",
    }:
        return [{"source_key": "shakarim_shezhire", "citation_note": None, "page_or_section": None}]
    return [dict(s) for s in CLAN_SOURCES_DEFAULT]


def _iter_all_clan_rows() -> list[tuple[str, str, str, str, str | None, str | None, int | None]]:
    out: list[tuple[str, str, str, str, str | None, str | None, int | None]] = []
    for c in GENEALOGY_P0_CLANS:
        parent = c.id if c.parent_id is None else c.parent_id
        out.append((parent, c.id, c.name_kk, c.name_lat or c.id, c.description_kk, c.name_kk_alt, c.sort_order))
    for row in CATALOG_CLAN_ROWS:
        out.append((*row, None))
    return out


def _merge_clan_registry() -> dict[str, dict[str, Any]]:
    registry: dict[str, dict[str, Any]] = {}
    sort_counters: dict[str, int] = {}

    def next_sort(parent_key: str) -> int:
        sort_counters[parent_key] = sort_counters.get(parent_key, 0) + 10
        return sort_counters[parent_key]

    for parent_slug, raw_slug, name_kk, name_lat, desc, alt, sort_order in _iter_all_clan_rows():
        slug = _canonical_slug(raw_slug)
        if slug in ZHUZ_SLUGS:
            parent_slug = slug
        parent_id = None if slug in ZHUZ_SLUGS else parent_slug
        if parent_id == slug:
            parent_id = None
        if slug in PARENT_SLUG_OVERRIDES:
            parent_id = PARENT_SLUG_OVERRIDES[slug]

        display_name = DISPLAY_NAME_OVERRIDES.get(slug, name_kk)
        rec = registry.get(slug, {})
        rec.update({
            "slug": slug,
            "parent_slug": parent_id,
            "name_kk": display_name,
            "name_lat": name_lat or slug,
            "description_kk": desc or rec.get("description_kk"),
            "name_kk_alt": alt if alt is not None else rec.get("name_kk_alt"),
            "sort_order": sort_order if sort_order is not None else rec.get("sort_order") or next_sort(parent_slug or slug),
        })
        registry[slug] = rec

    for slug, patch in NODE_PATCHES.items():
        canon = _canonical_slug(slug)
        if canon in registry:
            for k, v in patch.items():
                if v is not None:
                    registry[canon][k] = v

    missing = [s for s, r in registry.items() if r.get("parent_slug") and r["parent_slug"] not in registry]
    if missing:
        raise ValueError("Ата түйін табылмады: %s" % ", ".join(missing[:8]))

    def crumbs(s: str, seen: set[str] | None = None) -> list[str]:
        seen = seen or set()
        if s in seen:
            raise ValueError("Цикл: %s" % s)
        seen.add(s)
        p = registry[s].get("parent_slug")
        if not p:
            return [s]
        return crumbs(p, seen) + [s]

    for slug, rec in registry.items():
        rec["breadcrumbs"] = crumbs(slug)
        rec["level"] = len(rec["breadcrumbs"])
        rec["zhuz_root"] = rec["breadcrumbs"][0]
        rec["sources"] = _clan_sources_for_slug(slug, rec["zhuz_root"])

    _validate_registry(registry)
    return registry


def _validate_registry(registry: dict[str, dict[str, Any]]) -> None:
    by_parent_name: dict[tuple[str | None, str], str] = {}
    for slug, rec in registry.items():
        parent = rec.get("parent_slug")
        name = rec["name_kk"]
        key = (parent, name)
        if key in by_parent_name and by_parent_name[key] != slug:
            raise ValueError(
                "Бір ата астында қайталанған атау: %r -> %s және %s"
                % (key, by_parent_name[key], slug)
            )
        by_parent_name[key] = slug


def build_bundled_nodes() -> list[dict[str, Any]]:
    registry = _merge_clan_registry()
    nodes = []
    for slug in sorted(registry.keys(), key=lambda s: (registry[s]["level"], registry[s].get("sort_order", 0), s)):
        r = registry[slug]
        nodes.append({
            "slug": slug,
            "name_kk": r["name_kk"],
            "name_kk_alt": r.get("name_kk_alt"),
            "name_lat": r["name_lat"],
            "level": r["level"],
            "sort_order": r["sort_order"],
            "description_kk": r.get("description_kk"),
            "breadcrumbs": r["breadcrumbs"],
            "sources": r["sources"],
            "engine": "p0",
        })
    return nodes


def build_clan_defs_for_db() -> list[GenealogyClanDef]:
    registry = _merge_clan_registry()
    return [
        GenealogyClanDef(
            r["slug"],
            r.get("parent_slug"),
            r["level"],
            r["name_kk"],
            r["sort_order"],
            name_kk_alt=r.get("name_kk_alt"),
            name_lat=r.get("name_lat"),
            description_kk=r.get("description_kk"),
        )
        for slug in sorted(registry.keys(), key=lambda s: (registry[s]["level"], registry[s].get("sort_order", 0)))
        for r in [registry[slug]]
    ]


def _person_from_seed_def(p: Any) -> dict[str, Any]:
    return {
        "slug": p.id,
        "clan_slug": _canonical_slug(p.clan_slug),
        "name_kk": p.name_kk,
        "name_lat": p.name_lat,
        "birth_year": p.birth_year,
        "death_year": p.death_year,
        "era": p.era,
        "role_kk": p.role_kk,
        "bio_kk": p.bio_kk,
        "sort_order": p.sort_order,
        "sources": [dict(BIO_SOURCE)],
    }


def build_bundled_persons() -> list[dict[str, Any]]:
    from db.genealogy_persons_seed import GENEALOGY_PERSON_DEFS

    by_slug: dict[str, dict[str, Any]] = {}
    for pdef in GENEALOGY_PERSON_DEFS:
        by_slug[pdef.id] = _person_from_seed_def(pdef)

    for slug, clan, name_kk, name_lat, b, d, era, role, bio in PERSON_EXTRA_ROWS:
        canonical = PERSON_SLUG_ALIASES.get(slug, slug)
        clan_slug = _canonical_slug(clan)
        rec = {
            "slug": canonical,
            "clan_slug": clan_slug,
            "name_kk": name_kk,
            "name_lat": name_lat,
            "birth_year": b,
            "death_year": d,
            "era": era,
            "role_kk": role,
            "bio_kk": bio,
            "sort_order": 500,
            "sources": [dict(BIO_SOURCE)],
        }
        if canonical in by_slug:
            prev = by_slug[canonical]
            for key in ("name_kk", "name_lat", "birth_year", "death_year", "era", "role_kk", "bio_kk"):
                if rec.get(key):
                    prev[key] = rec[key]
        else:
            by_slug[canonical] = rec

    return sorted(by_slug.values(), key=lambda p: (p.get("sort_order", 999), p["slug"]))


def build_bundled_snapshot(version: int = 5) -> dict[str, Any]:
    nodes = build_bundled_nodes()
    persons = build_bundled_persons()
    registry = {n["slug"]: n for n in nodes}
    for p in persons:
        if p["clan_slug"] not in registry:
            raise ValueError("Тұлға руы жоқ: %s -> %s" % (p["slug"], p["clan_slug"]))

    roots = [
        {
            "slug": n["slug"],
            "name_kk": n["name_kk"],
            "name_kk_alt": n.get("name_kk_alt"),
            "name_lat": n.get("name_lat"),
            "level": n["level"],
            "sort_order": n["sort_order"],
        }
        for n in nodes if n["level"] == 1
    ]
    return {
        "version": version,
        "engine": "p0",
        "roots": roots,
        "nodes": nodes,
        "persons": persons,
    }
