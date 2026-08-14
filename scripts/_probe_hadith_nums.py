import sqlite3
from pathlib import Path

con = sqlite3.connect(Path(__file__).resolve().parents[1] / "global_clean.db")
nums = [9, 10, 14, 16, 20, 24, 39, 47, 50, 56, 100, 112, 200, 500, 650, 737, 1145, 1501, 1901, 2442, 3461, 5970, 5971, 6016, 6018, 6114, 6491, 1379, 5063, 6110, 6479]
for n in nums:
    r = con.execute(
        "SELECT hadith_no, substr(coalesce(text_ru,''),1,70) FROM hadith WHERE source=? AND cast(hadith_no as text)=? LIMIT 1",
        ("Sahih al-Bukhari", str(n)),
    ).fetchone()
    print(n, "OK" if r else "MISS", (r[1] if r else "")[:60])
print(
    "bukhari",
    con.execute("SELECT count(*) FROM hadith WHERE source='Sahih al-Bukhari'").fetchone()[0],
)
print(
    "with_ru",
    con.execute(
        "SELECT count(*) FROM hadith WHERE source='Sahih al-Bukhari' AND length(coalesce(text_ru,''))>20"
    ).fetchone()[0],
)
