import json
from pathlib import Path

rows = json.loads(Path("scripts/_hadith_candidates.json").read_text(encoding="utf-8"))
wanted = {
    4, 5, 6, 9, 10, 14, 16, 17, 19, 20, 21, 22, 24, 26, 28, 29, 31, 34, 35, 36, 37, 38,
    39, 40, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59, 60, 61, 62,
    63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,
    84, 85, 86, 87, 88, 89, 90, 100, 112, 130, 136, 140, 153, 177, 200, 247, 298, 389,
    430, 477, 527, 574, 629, 650, 671, 737, 756, 799, 860, 894, 970, 1040, 1103, 1160,
    1201, 1344, 1379, 1420, 1520, 1773,
}
out = []
for r in rows:
    if r["collection"] == "bukhari" and r["no"] in wanted:
        out.append(f"B{r['no']}|{r['en'][:160]}")
for r in rows:
    if r["collection"] == "muslim" and r["no"] <= 120:
        out.append(f"M{r['no']}|{r['en'][:160]}")
Path("scripts/_hadith_pick_snips.txt").write_text("\n".join(out), encoding="utf-8")
print(len(out), "lines")
