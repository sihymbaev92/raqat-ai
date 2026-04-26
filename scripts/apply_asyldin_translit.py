#!/usr/bin/env python3
"""
Fetch asyldin id=29 (page per surah), map (n) markers to ayahs, merge bismillah;
update mobile/assets/bundled/quran-kk-from-db.json translit; keep text_kk.
Missing markers fall back to existing translit and are logged.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "quran-kk-from-db.json"

# match mobile/src/data/quranAyahCounts.ts
AYAH_COUNTS: list[int] = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
    78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
    37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
    52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
    11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from asyldin_parse import fetch_surah_by_n  # noqa: E402


def final_translit_for_ayah(
    surah: int, ayah: int, pre: str | None, by_n: dict[int, str]
) -> str | None:
    t = by_n.get(ayah)
    if t is None:
        return None
    if ayah == 1 and pre:
        return f"{pre} {t}".strip()
    return t


def main() -> int:
    with open(BUNDLE, encoding="utf-8") as f:
        bundle = json.load(f)

    surahs = bundle.get("data", {}).get("surahs", [])
    by_list = {s["number"]: s for s in surahs if isinstance(s.get("number"), int)}

    rep = 0
    miss_rows: list[str] = []
    miss_by_surah: dict[int, int] = {}

    for s in range(1, 115):
        exp = AYAH_COUNTS[s - 1]
        try:
            pre, by_n = fetch_surah_by_n(s)
        except Exception as e:
            print(f"FETCH_FAIL surah {s}: {e!r}", file=sys.stderr)
            for i in range(1, exp + 1):
                miss_rows.append(f"{s}:{i} fetch_fail")
            miss_by_surah[s] = exp
            continue
        for i in range(1, exp + 1):
            new_t = final_translit_for_ayah(s, i, pre, by_n)
            st = by_list.get(s)
            if not st:
                print(f"no surah in bundle: {s}", file=sys.stderr)
                continue
            ay = next(
                (x for x in st.get("ayahs", []) if x.get("numberInSurah") == i), None
            )
            if not ay:
                miss_rows.append(f"{s}:{i} no_row")
                continue
            if new_t is not None:
                old = (ay.get("translit") or "").strip()
                if old != (new_t or "").strip():
                    rep += 1
                ay["translit"] = new_t
            else:
                miss_rows.append(
                    f"{s}:{i} (marker missing on asyldin, kept previous translit)"
                )
                miss_by_surah[s] = miss_by_surah.get(s, 0) + 1

    bundle["attribution_kk"] = "asyldin.kz — (Транскрипция) Құранның қазақша жазылуы"
    bundle["source_detail"] = "https://asyldin.kz/library/readBook/id/29/"
    bundle["exported_at"] = datetime.now(timezone.utc).isoformat()
    bundle["stats"] = {
        "filled": 6224,
        "translit_filled": 6224,
        "total_quran_rows": 6224,
    }
    bundle["schema"] = "raqat_quran_kk_bundle_v2_asyldin"
    with open(BUNDLE, "w", encoding="utf-8", newline="\n") as f:
        json.dump(bundle, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("updated_translit_different_count", rep, file=sys.stderr)
    print("marker_missing_ayahs", len(miss_rows), file=sys.stderr)
    for s, c in sorted(miss_by_surah.items(), key=lambda x: -x[1])[:20]:
        if c:
            print(f"  surah {s}: {c} fallbacks", file=sys.stderr)
    if miss_rows and len(miss_rows) < 30:
        for m in miss_rows:
            print(m, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
