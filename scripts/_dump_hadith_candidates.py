"""Dump candidate Bukhari/Muslim rows for curated KK expansion."""
from __future__ import annotations

import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "global_clean.db"
CAT = ROOT / "mobile" / "assets" / "bundled" / "kz-trusted-hadith-catalog.json"

# Classic / frequently cited numbers (USC-MSA / common app numbering)
CANDIDATES = [
    ("bukhari", n)
    for n in [
        6, 9, 10, 14, 16, 18, 20, 24, 27, 28, 39, 47, 49, 50, 56, 73, 86, 87, 89,
        100, 112, 130, 136, 140, 153, 156, 177, 200, 212, 247, 298, 346, 389,
        430, 477, 500, 527, 574, 629, 650, 671, 698, 737, 756, 799, 860, 894,
        970, 984, 1040, 1050, 1103, 1120, 1160, 1180, 1201, 1234, 1300, 1344,
        1358, 1379, 1420, 1460, 1485, 1520, 1550, 1600, 1650, 1680, 1720, 1773,
        1800, 1850, 1880, 1920, 2000, 2050, 2100, 2200, 2250, 2300, 2350, 2400,
        2450, 2500, 2550, 2600, 2650, 2700, 2750, 2800, 2850, 2900, 2950, 3000,
        3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200,
        4300, 4400, 4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300, 5400,
        5500, 5600, 5700, 5800, 5900, 5950, 6000, 6050, 6100, 6150, 6200, 6300,
        6400, 6450, 6480, 6500, 6550, 6600, 6700, 6800, 6900, 7000, 7100, 7200,
        # high-value classics not in round numbers
        4, 5, 17, 19, 21, 22, 26, 29, 31, 34, 35, 36, 37, 38, 40, 41, 42, 43,
        44, 46, 48, 51, 54, 55, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68,
        69, 70, 71, 72, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 90,
        91, 92, 93, 94, 95, 96, 97, 98, 99, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122,
        123, 124, 125, 126, 127, 128, 129, 131, 132, 133, 134, 135, 137, 138,
        139, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150,
    ]
] + [
    ("muslim", n)
    for n in [
        2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39,
        41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 56, 57, 58, 59, 60,
        100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300,
        1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500,
        2550, 2560, 2570, 2580, 2590, 2600, 2610, 2620, 2630, 2640, 2650, 2660,
        2670, 2680, 2690, 2700, 2710, 2720, 2735, 2740, 2750, 2760, 2770, 2780,
        2790, 2800, 2810, 2820, 2830, 2840, 2850, 2860, 2870, 2880, 2890, 2900,
    ]
]

existing = set()
cat = json.loads(CAT.read_text(encoding="utf-8"))
for it in cat["items"]:
    existing.add((it["collection"], int(it["reference"])))

con = sqlite3.connect(str(DB))
out = []
for coll, no in CANDIDATES:
    if (coll, no) in existing:
        continue
    source = "Sahih al-Bukhari" if coll == "bukhari" else "Sahih Muslim"
    row = con.execute(
        """
        SELECT substr(coalesce(text_ar,''),1,80),
               substr(coalesce(text_ru,''),1,220),
               substr(coalesce(text_en,''),1,220),
               length(coalesce(text_ar,''))
        FROM hadith
        WHERE source=? AND cast(hadith_no as text)=?
        LIMIT 1
        """,
        (source, str(no)),
    ).fetchone()
    if not row or not row[3] or row[3] < 20:
        continue
    body = (row[2] or row[1] or "").strip()
    if len(body) < 40:
        continue
    out.append(
        {
            "collection": coll,
            "no": no,
            "ar": row[0],
            "en": body[:220],
        }
    )

con.close()
print(json.dumps({"available": len(out), "sample": out[:40]}, ensure_ascii=False, indent=2))
Path(ROOT / "scripts" / "_hadith_candidates.json").write_text(
    json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("wrote", len(out), "candidates")
