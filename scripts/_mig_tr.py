import sqlite3

c = sqlite3.connect("global_clean.db")
cols = {r[1] for r in c.execute("PRAGMA table_info(hadith)")}
if "text_tr" not in cols:
    c.execute("ALTER TABLE hadith ADD COLUMN text_tr TEXT")
    c.commit()
    print("text_tr added")
else:
    print("text_tr exists")
for col in ("text_en", "text_ru", "text_tr"):
    n = c.execute(f"SELECT count(*) FROM hadith WHERE {col} IS NOT NULL AND {col}<>''").fetchone()[0]
    print(col, "filled:", n)
c.close()
