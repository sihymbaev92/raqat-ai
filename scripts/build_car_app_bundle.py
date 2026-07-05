#!/usr/bin/env python3
"""Car hub bundle: asma, hadith, dhikr, halal snapshot → Android Auto / CarPlay assets."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUNDLED = ROOT / "mobile" / "assets" / "bundled"
OUT_ANDROID = ROOT / "mobile" / "android" / "app" / "src" / "main" / "assets" / "car" / "app_hub_bundle.json"
OUT_IOS = ROOT / "mobile" / "ios" / "RAHATOMIR" / "car_app_hub_bundle.json"

HUB_MODULES = [
    {"id": "prayer", "title": "Намаз уақыты", "subtitle": "Келесі намаз · кесте"},
    {"id": "quran", "title": "Құран", "subtitle": "114 сүре · 6236 аят"},
    {"id": "hadith", "title": "Хадис", "subtitle": "Сахих жинақ"},
    {"id": "duas", "title": "Дұға · зікір", "subtitle": "Тәспіх және дұға"},
    {"id": "tasbih", "title": "Тәспіх", "subtitle": "Зікір санау"},
    {"id": "asma", "title": "Әсма әл-Хусна", "subtitle": "99 есім"},
    {"id": "qibla", "title": "Құбыла", "subtitle": "Бағыт"},
    {"id": "halal", "title": "Халал", "subtitle": "Компаниялар тізімі"},
    {"id": "namaz", "title": "Намаз гиді", "subtitle": "Телефonda толық"},
    {"id": "ai", "title": "AI көмекші", "subtitle": "Телефonda"},
    {"id": "tradition", "title": "Дін мен дәстүр", "subtitle": "Телефonda"},
    {"id": "hajj", "title": "Қажылық", "subtitle": "Телефonda"},
]


def load_json(path: Path) -> dict | list:
    return json.loads(path.read_text(encoding="utf-8"))


def build_halal_preview() -> dict:
    path = BUNDLED / "halal-companies-snapshot.json"
    if not path.is_file():
        return {"total": 0, "companies": []}
    root = load_json(path)
    rows = root.get("companies") if isinstance(root, dict) else []
    if not isinstance(rows, list):
        return {"total": 0, "companies": []}
    preview = []
    for row in rows[:60]:
        if not isinstance(row, dict):
            continue
        preview.append(
            {
                "name": str(row.get("name") or row.get("title") or "").strip(),
                "city": str(row.get("city") or row.get("region") or "").strip(),
            }
        )
    return {"total": len(rows), "companies": [c for c in preview if c["name"]]}


def build_hadith() -> list[dict]:
    path = BUNDLED / "hadith-sahih-seed.json"
    if not path.is_file():
        return []
    root = load_json(path)
    items = []
    for h in root.get("hadiths") or []:
        if not isinstance(h, dict):
            continue
        arabic = str(h.get("arabic") or "").strip()
        if not arabic:
            continue
        items.append(
            {
                "id": str(h.get("id") or ""),
                "collection": str(h.get("collectionNameKk") or h.get("collection") or ""),
                "citation": str(h.get("sourceCitationKk") or h.get("reference") or ""),
                "arabic": arabic[:500],
                "narrator": str(h.get("narratorKk") or "").strip(),
            }
        )
    return items


def build_dhikr() -> list[dict]:
    path = BUNDLED / "dhikr-list.json"
    if not path.is_file():
        return []
    root = load_json(path)
    items = []
    for d in root.get("items") or []:
        if not isinstance(d, dict):
            continue
        items.append(
            {
                "id": d.get("id"),
                "title": str(d.get("textKk") or "").strip(),
                "ar": str(d.get("textAr") or "").strip(),
                "meaning": str(d.get("meaningKk") or "").strip()[:280],
                "target": d.get("defaultTarget"),
            }
        )
    return items


def build_asma() -> list[dict]:
    path = BUNDLED / "asma-al-husna-kk.json"
    if not path.is_file():
        return []
    raw = load_json(path)
    if not isinstance(raw, list):
        return []
    return [{"n": r.get("n"), "ar": r.get("ar", ""), "kk": r.get("kk", "")} for r in raw if isinstance(r, dict)]


def main() -> int:
    payload = {
        "version": 1,
        "modules": HUB_MODULES,
        "asma": build_asma(),
        "hadith": build_hadith(),
        "dhikr": build_dhikr(),
        "halal": build_halal_preview(),
        "phoneModules": ["namaz", "ai", "tradition", "hajj", "tajweed", "seerah"],
    }
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    OUT_ANDROID.parent.mkdir(parents=True, exist_ok=True)
    OUT_ANDROID.write_text(raw, encoding="utf-8")
    OUT_IOS.parent.mkdir(parents=True, exist_ok=True)
    OUT_IOS.write_text(raw, encoding="utf-8")
    print(
        f"Wrote hub bundle → {OUT_ANDROID} ({len(raw)//1024} KB) "
        f"asma={len(payload['asma'])} hadith={len(payload['hadith'])} "
        f"dhikr={len(payload['dhikr'])} halal={payload['halal']['total']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
