"""Merge QMDB KK Bukhari export into mobile hadith-from-db-seed.json."""
import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db-seed.json"
KK_EXPORT = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db-kk-export.json"

DEFAULT_EDITIONS = {
    "en": "eng-bukhari / eng-muslim (fawazahmed0)",
    "ru": "rus-bukhari / rus-muslim (fawazahmed0)",
    "tr": "tur-bukhari / tur-muslim (fawazahmed0)",
    "ar": "ara text in seed",
    "kk": "kz-trusted catalog",
    "ky": "HadeethEnc.com (matched rows)",
    "uz": "HadeethEnc.com (matched rows)",
}

seed = json.loads(SEED.read_text(encoding="utf-8"))
kk = json.loads(KK_EXPORT.read_text(encoding="utf-8"))

bukhari_ids = {h["id"] for h in kk["hadiths"]}
muslim_keep = [h for h in seed["hadiths"] if h.get("collection") == "muslim" and h["id"] not in bukhari_ids]
merged = kk["hadiths"] + muslim_keep

prev_prov = seed.get("provenance") or {}
prev_editions = prev_prov.get("editions") if isinstance(prev_prov.get("editions"), dict) else {}
editions = {**DEFAULT_EDITIONS, **prev_editions}

out = {
    "version": max(seed.get("version", 0), kk.get("version", 0), 12),
    "provenance": {
        "origin": "RAQAT · QMDB Bukhari PDF (2005) + trusted Muslim seed",
        "evidenceKk": (
            "Қазақша: «Сахих әл-Бұхари» I–II том (ҚМДБ, 2005), Доскелді Қожатайұлы аудармасы. "
            "Арабша/en/ru/tr — fawazahmed0/hadith-api (MIT). ky/uz — HadeethEnc.com."
        ),
        "recordedAt": kk.get("provenance", {}).get("recordedAt")
        or datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "licenseHint": "Қазақша мәтін — ҚМДБ басылымы; арабша — ашық API.",
        "editions": editions,
    },
    "hadiths": merged,
}

SEED.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"seed rows: {len(merged)} (bukhari_kk={len(kk['hadiths'])}, muslim={len(muslim_keep)})")
