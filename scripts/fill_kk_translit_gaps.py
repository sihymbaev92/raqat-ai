#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Толықтыру: asyldin-да жоқ аяттар + бандлда толық жоқ жолдар.
Kazakh translit: services.quran_translit (Uthmani), text_kk жаңа жолдарда бос.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "quran-kk-from-db.json"
UTH = ROOT / "mobile" / "assets" / "bundled" / "quran-uthmani-full.json"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.quran_translit import transliterate_arabic_to_kazakh  # noqa: E402

AYAH_COUNTS: list[int] = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
    78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
    37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
    52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
    11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

# asyldin-да толық жоқ, ескі сыртқы латын қоспасы болып қалған
UPDATE_ALGO_AYAHS: list[tuple[int, int]] = [(25, n) for n in range(21, 33)] + [(35, 44), (35, 45)]


def build_uthmani_map() -> dict[tuple[int, int], str]:
    data = json.loads(UTH.read_text(encoding="utf-8"))["data"]["surahs"]
    m: dict[tuple[int, int], str] = {}
    for s in data:
        sn = s["number"]
        for a in s.get("ayahs", []):
            m[(sn, a["numberInSurah"])] = a.get("text", "") or ""
    return m


def list_missing_rows(bundle: dict) -> list[tuple[int, int]]:
    by = {s["number"]: {a["numberInSurah"] for a in s["ayahs"]} for s in bundle["data"]["surahs"]}
    out: list[tuple[int, int]] = []
    for s in range(1, 115):
        for a in range(1, AYAH_COUNTS[s - 1] + 1):
            if a not in by.get(s, set()):
                out.append((s, a))
    return out


def main() -> int:
    umap = build_uthmani_map()
    bundle = json.loads(BUNDLE.read_text(encoding="utf-8"))
    by_surah = {s["number"]: s for s in bundle["data"]["surahs"]}
    n_upd = 0
    n_ins = 0

    for s, a in UPDATE_ALGO_AYAHS:
        st = by_surah.get(s)
        if not st:
            print(f"skip: no surah {s}", file=sys.stderr)
            continue
        ay = next((x for x in st["ayahs"] if x["numberInSurah"] == a), None)
        if not ay:
            print(f"skip: no ayah {s}:{a}", file=sys.stderr)
            continue
        ar = umap.get((s, a), "")
        if not ar:
            print(f"warn: no Uthmani {s}:{a}", file=sys.stderr)
            continue
        new_t = transliterate_arabic_to_kazakh(ar)
        if (ay.get("translit") or "").strip() != new_t.strip():
            n_upd += 1
        ay["translit"] = new_t

    for s, a in list_missing_rows(bundle):
        st = by_surah.get(s)
        if not st:
            continue
        ar = umap.get((s, a), "")
        if not ar:
            print(f"skip insert: no Uthmani {s}:{a}", file=sys.stderr)
            continue
        tr = transliterate_arabic_to_kazakh(ar)
        st["ayahs"].append(
            {
                "numberInSurah": a,
                "text_kk": "",
                "translit": tr,
            }
        )
        n_ins += 1

    for s in by_surah:
        by_surah[s]["ayahs"].sort(key=lambda x: int(x["numberInSurah"]))

    total = sum(len(s["ayahs"]) for s in bundle["data"]["surahs"])
    bundle["stats"] = {
        "filled": total,
        "translit_filled": total,
        "total_quran_rows": total,
    }
    bundle["exported_at"] = datetime.now(timezone.utc).isoformat()
    detail = (bundle.get("source_detail") or "").strip()
    tag = "gaps: Uthmani→quran_translit.py"
    if tag not in detail:
        detail = f"{detail} | {tag}".strip(" |") if detail else tag
    bundle["source_detail"] = detail
    BUNDLE.write_text(
        json.dumps(bundle, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print("updated_existing", n_upd, "inserted", n_ins, "total_rows", total, file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
