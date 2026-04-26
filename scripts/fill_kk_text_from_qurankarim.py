#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Бос text_kk жолдарын qurankarim.kz API (Халифа Алтай) арқылы толықтырады.
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "quran-kk-from-db.json"

BASE = "https://qurankarim.kz/api/v1/sura/number"


def fetch_sura(sura: int) -> dict:
    url = f"{BASE}/{sura}"
    req = urllib.request.Request(url, headers={"User-Agent": "RAQAT/1.0 (quran-kk fill)"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.loads(resp.read().decode("utf-8"))


def build_kk_by_db_ayah(sura: int, ayats_list: list) -> dict[int, str]:
    by_num = {int(a["ayat_number"]): (a.get("qazaq_text") or "").strip() for a in ayats_list}
    out: dict[int, str] = {}
    if sura == 1:
        for n in range(1, 8):
            if n in by_num:
                out[n] = by_num[n]
        return out
    if 0 in by_num and 1 in by_num:
        out[1] = f"{by_num[0]} {by_num[1]}".strip()
        for n in range(2, max(by_num.keys(), default=0) + 1):
            if n in by_num:
                out[n] = by_num[n]
        return out
    for n, t in by_num.items():
        if n >= 1:
            out[n] = t
    return out


def main() -> int:
    data = json.loads(BUNDLE.read_text(encoding="utf-8"))
    surahs = {s["number"]: s for s in data.get("data", {}).get("surahs", [])}
    need_surahs: set[int] = set()
    to_fill: list[tuple[int, int]] = []
    for s in surahs.values():
        sn = s["number"]
        for ay in s.get("ayahs", []):
            n = int(ay["numberInSurah"])
            t = (ay.get("text_kk") or "").strip()
            if not t:
                to_fill.append((sn, n))
                need_surahs.add(sn)

    if not to_fill:
        print("no empty text_kk", file=sys.stderr)
        return 0

    cache: dict[int, dict[int, str]] = {}
    for sn in sorted(need_surahs):
        try:
            raw = fetch_sura(sn)
        except (urllib.error.URLError, json.JSONDecodeError, OSError) as e:
            print(f"fetch surah {sn} failed: {e}", file=sys.stderr)
            return 1
        al = raw.get("ayats_list") or []
        cache[sn] = build_kk_by_db_ayah(sn, al)
        time.sleep(0.35)

    filled = 0
    still_empty: list[tuple[int, int]] = []
    for sn, n in to_fill:
        t = (cache.get(sn) or {}).get(n, "").strip()
        st = surahs[sn]
        for ay in st["ayahs"]:
            if int(ay["numberInSurah"]) == n:
                if t:
                    ay["text_kk"] = t
                    filled += 1
                else:
                    still_empty.append((sn, n))
                break
        else:
            still_empty.append((sn, n))

    data["exported_at"] = datetime.now(timezone.utc).isoformat()
    note = "text_kk gaps: qurankarim.kz API (Халифа Алтай)"
    d = (data.get("source_detail") or "").strip()
    if note not in d:
        data["source_detail"] = f"{d} | {note}".strip(" |") if d else note

    BUNDLE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"filled {filled} empty rows; still_empty {len(still_empty)}", file=sys.stderr)
    if still_empty:
        for x in still_empty:
            print(f"  missing {x[0]}:{x[1]}", file=sys.stderr)
    return 0 if not still_empty else 1


if __name__ == "__main__":
    raise SystemExit(main())
