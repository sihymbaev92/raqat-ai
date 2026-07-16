#!/usr/bin/env python3
"""
Download full Quran tajweed text (114 surahs) from Al Quran Cloud and save clean JSON.

  python mobile/scripts/download_quran_tajweed.py
  python mobile/scripts/download_quran_tajweed.py --output mobile/assets/quran_tajweed.json
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

API_URL = "https://api.alquran.cloud/v1/quran/quran-tajweed"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "assets" / "quran_tajweed.json"
USER_AGENT = "RAQAT-mobile/1.1 (+https://api.alquran.cloud; tajweed seed importer)"


def fetch_payload(url: str, timeout_sec: int = 120) -> dict[str, Any]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        raise SystemExit(f"HTTP error {exc.code} from {url}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Network error fetching {url}: {exc.reason}") from exc

    body = json.loads(raw)
    if body.get("code") != 200 or not isinstance(body.get("data"), dict):
        raise SystemExit("Unexpected API payload: expected code=200 and data object")
    return body


def clean_ayah(ayah: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {
        "number": ayah.get("number"),
        "numberInSurah": ayah.get("numberInSurah"),
        "text": (ayah.get("text") or "").strip(),
    }
    for key in ("juz", "manzil", "page", "ruku", "hizbQuarter", "sajda"):
        if key in ayah and ayah[key] is not None:
            out[key] = ayah[key]
    return out


def clean_surah(surah: dict[str, Any]) -> dict[str, Any]:
    ayahs = [clean_ayah(a) for a in surah.get("ayahs") or []]
    return {
        "number": surah.get("number"),
        "name": surah.get("name"),
        "englishName": surah.get("englishName"),
        "englishNameTranslation": surah.get("englishNameTranslation"),
        "revelationType": surah.get("revelationType"),
        "numberOfAyahs": surah.get("numberOfAyahs") or len(ayahs),
        "ayahs": ayahs,
    }


def build_clean_document(api_body: dict[str, Any]) -> dict[str, Any]:
    data = api_body["data"]
    surahs_raw = data.get("surahs")
    if not isinstance(surahs_raw, list):
        raise SystemExit("API data.surahs missing or not a list")

    surahs = [clean_surah(s) for s in surahs_raw if isinstance(s, dict)]
    surahs.sort(key=lambda s: int(s.get("number") or 0))

    ayah_count = sum(len(s.get("ayahs") or []) for s in surahs)
    tagged_ayah_count = sum(
        1
        for s in surahs
        for a in s.get("ayahs") or []
        if "[" in (a.get("text") or "")
    )

    return {
        "version": 1,
        "source": API_URL,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "edition": data.get("edition") or api_body.get("data", {}).get("edition"),
        "surahCount": len(surahs),
        "ayahCount": ayah_count,
        "taggedAyahCount": tagged_ayah_count,
        "surahs": surahs,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Download quran-tajweed JSON from Al Quran Cloud")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUT,
        help=f"Output JSON path (default: {DEFAULT_OUT})",
    )
    parser.add_argument("--url", default=API_URL, help="API endpoint URL")
    args = parser.parse_args()

    print(f"Fetching {args.url} …")
    api_body = fetch_payload(args.url)
    doc = build_clean_document(api_body)

    if doc["surahCount"] != 114:
        print(f"Warning: expected 114 surahs, got {doc['surahCount']}", file=sys.stderr)

    out_path: Path = args.output
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"Wrote {out_path}")
    print(
        f"  {doc['surahCount']} surahs · {doc['ayahCount']} ayahs · "
        f"{doc['taggedAyahCount']} tajweed-tagged · {size_mb:.2f} MB"
    )


if __name__ == "__main__":
    main()
