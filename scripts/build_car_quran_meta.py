#!/usr/bin/env python3
"""114 surah metadata + optional offline Arabic ayahs for Android Auto / CarPlay."""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAR_DIR = ROOT / "mobile" / "android" / "app" / "src" / "main" / "assets" / "car"
OUT = CAR_DIR / "quran_surah_meta.json"
AYAH_OUT = CAR_DIR / "quran_arabic_bundle.json"
IOS_META = ROOT / "mobile" / "ios" / "RAHATOMIR" / "car_quran_surah_meta.json"
IOS_AYAH = ROOT / "mobile" / "ios" / "RAHATOMIR" / "car_quran_arabic_bundle.json"

AYAH_COUNTS = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
    78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
    37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
    52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
    11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

UA = "Raqat-Car-Quran/1.0"


def fetch_json(url: str, timeout: int = 120) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_surah_list() -> list[dict]:
    data = fetch_json("https://api.alquran.cloud/v1/surah")
    return data.get("data") or []


def build_meta(api: list[dict]) -> dict:
    by_num = {int(row["number"]): row for row in api if isinstance(row, dict) and row.get("number")}
    items = []
    for i, count in enumerate(AYAH_COUNTS, start=1):
        row = by_num.get(i, {})
        items.append(
            {
                "n": i,
                "englishName": str(row.get("englishName") or f"Surah {i}"),
                "arabicName": re.sub(r"\s+", " ", str(row.get("name") or "")).strip(),
                "ayahs": count,
            }
        )
    return {"version": 1, "totalAyahs": 6236, "surahs": items}


def build_arabic_bundle() -> dict | None:
    try:
        root = fetch_json("https://api.alquran.cloud/v1/quran/quran-uthmani", timeout=180)
    except Exception as exc:
        print(f"WARN: full quran fetch failed ({exc})", file=sys.stderr)
        return None

    surahs_out: list[dict] = []
    for s in root.get("data", {}).get("surahs") or []:
        n = int(s.get("number") or 0)
        if n < 1 or n > 114:
            continue
        texts = []
        for a in s.get("ayahs") or []:
            t = re.sub(r"\s+", " ", str(a.get("text") or "")).strip()
            texts.append(t)
        if texts:
            surahs_out.append({"n": n, "t": texts})

    if len(surahs_out) < 114:
        print(f"WARN: only {len(surahs_out)}/114 surahs in arabic bundle", file=sys.stderr)
        return None

    return {"version": 1, "edition": "quran-uthmani", "surahs": surahs_out}


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    path.write_text(raw, encoding="utf-8")
    print(f"Wrote → {path} ({len(raw) // 1024} KB)")


def main() -> int:
    skip_ayahs = "--meta-only" in sys.argv

    try:
        api = fetch_surah_list()
    except Exception as exc:
        print(f"WARN: surah list fetch failed ({exc}), using fallback names", file=sys.stderr)
        api = []

    meta = build_meta(api)
    write_json(OUT, meta)
    write_json(IOS_META, meta)

    if skip_ayahs:
        return 0

    ayahs = build_arabic_bundle()
    if ayahs:
        write_json(AYAH_OUT, ayahs)
        write_json(IOS_AYAH, ayahs)
    else:
        print("SKIP: arabic ayah bundle not updated (network or incomplete data)", file=sys.stderr)
        return 1 if not AYAH_OUT.is_file() else 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
