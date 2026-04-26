import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AYAH_COUNTS: list[int] = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112,
    78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59,
    37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52,
    52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21,
    11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
]

b = json.loads((ROOT / "mobile" / "assets" / "bundled" / "quran-kk-from-db.json").read_text(encoding="utf-8"))
by = {s["number"]: {a["numberInSurah"] for a in s["ayahs"]} for s in b["data"]["surahs"]}
missing: list[tuple[int, int]] = []
for s in range(1, 115):
    exp = AYAH_COUNTS[s - 1]
    have = by.get(s, set())
    for a in range(1, exp + 1):
        if a not in have:
            missing.append((s, a))
print("missing count", len(missing), missing)
sys.path.insert(0, str(ROOT))
from services.quran_translit import transliterate_arabic_to_kazakh  # noqa: E402

q = json.loads((ROOT / "mobile" / "assets" / "bundled" / "quran-uthmani-full.json").read_text(encoding="utf-8"))["data"][
    "surahs"
]
qmap: dict[tuple[int, int], str] = {}
for surah in q:
    sn = surah["number"]
    for a in surah.get("ayahs", []):
        qmap[(sn, a["numberInSurah"])] = a.get("text", "")

def show(sa: tuple[int, int]) -> None:
    s, ay = sa
    ar = qmap.get((s, ay), "")
    tr = transliterate_arabic_to_kazakh(ar)[:100]
    print(s, ay, "ar_len", len(ar), "tr", tr, "…")


for m in missing:
    show(m)
