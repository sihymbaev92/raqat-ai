#!/usr/bin/env python3
"""Expand kz-trusted hadith catalog from DB candidates (RU→KK via gtx).

Adds up to --limit new curated entries with real Arabic from global_clean.db
and Kazakh meaning translated from existing Sahih Russian text (not invented matn).
Then merges new KK rows into hadith-from-db-seed.json.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB = ROOT / "global_clean.db"
CANDS = ROOT / "scripts" / "_hadith_candidates.json"
CATALOG_JSON = ROOT / "mobile" / "assets" / "bundled" / "kz-trusted-hadith-catalog.json"
CATALOG_TS = ROOT / "mobile" / "src" / "content" / "kzTrustedHadithCatalog.ts"
SEED = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db-seed.json"

SOURCE_NOTE = (
    "Дереккөз: Сахих әл-Бұхари / Сахих Муслим — Қазақстан мұсылмандары "
    "Діни басқармасы (ҚМДБ) ұстанатын сенімді хадис жинақтары. "
    "Қазақша мағына қолданба ішінде берілген; сыртқы сайтқа жіберілмейді. "
    "Фиқһтық үкім үшін ҚМДБ/Ханафи түсіндірмесіне жүгініңіз."
)

THEME_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"намaz|молитв|salah|prayer|намаз", re.I), "Намаз"),
    (re.compile(r"пост|ораз|ramadan|рамаз|sawm|fast", re.I), "Ораза"),
    (re.compile(r"закят|зекет|zakat|садак|милост|charity|sadaka", re.I), "Зекет және садақа"),
    (re.compile(r"хадж|hajj|қажы|паломн", re.I), "Қажылық"),
    (re.compile(r"родител|ата-ана|mother|father|матер|отц", re.I), "Ата-ана"),
    (re.compile(r"сосед|көрші|neighbour|neighbor", re.I), "Көрші"),
    (re.compile(r"сирот|жетім|orphan", re.I), "Жетім"),
    (re.compile(r"гнев|ашу|anger", re.I), "Ашу"),
    (re.compile(r"язык|тіл|tongue|слово", re.I), "Тіл әдебі"),
    (re.compile(r"вера|иман|faith|belief", re.I), "Иман"),
    (re.compile(r"знания|білім|knowledge|учен", re.I), "Білім"),
    (re.compile(r"покаян|тәубе|repent|tawba", re.I), "Тәубе"),
    (re.compile(r"рай|жәннат|paradise|jannah", re.I), "Жәннат"),
    (re.compile(r"ад|тозақ|hell|fire", re.I), "Ақырет"),
    (re.compile(r"брак|неке|marriage|wife|муж", re.I), "Отбасы"),
    (re.compile(r"гост|қонақ|guest|hospit", re.I), "Қонақ"),
    (re.compile(r"милосерд|рахым|mercy|rahma", re.I), "Рахымдылық"),
    (re.compile(r"правд|шыншыл|truth|falsehood|лож", re.I), "Шыншылдық"),
]


def gtx(text: str, sl: str, tl: str) -> str:
    q = urllib.parse.urlencode({"client": "gtx", "sl": sl, "tl": tl, "dt": "t", "q": text})
    url = f"https://translate.googleapis.com/translate_a/single?{q}"
    req = urllib.request.Request(url, headers={"User-Agent": "RAQAT-hadith-expand/1"})
    with urllib.request.urlopen(req, timeout=40) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    parts = data[0] if isinstance(data, list) and data else []
    out = "".join((row[0] or "") for row in parts if isinstance(row, list))
    return out.strip()


def theme_for(ru: str, en: str) -> str:
    blob = f"{ru} {en}"
    for pat, theme in THEME_RULES:
        if pat.search(blob):
            return theme
    return "Сахих хадис"


def format_kk_meaning(raw: str) -> str:
    t = raw.strip()
    # Drop common narrator prefixes after MT
    t = re.sub(r"^(Передаётся|Передал[аои]?|Рассказал[аои]?|От)\s+[^:]{0,80}:\s*", "", t, flags=re.I)
    t = re.sub(r"^Аллахтың\s+Елшісі\s*\([^)]*\)\s*айтты\s*[:：]?\s*", "Пайғамбар ﷺ: ", t, flags=re.I)
    if "Пайғамбар" not in t[:40] and "ﷺ" not in t[:40]:
        if t.startswith("«") or t.startswith('"'):
            t = f"Пайғамбар ﷺ: {t}"
        else:
            t = f"Пайғамбар ﷺ: «{t.rstrip('.')}»."
    return t


def fetch_row(con: sqlite3.Connection, collection: str, no: int) -> dict | None:
    source = "Sahih al-Bukhari" if collection == "bukhari" else "Sahih Muslim"
    row = con.execute(
        """
        SELECT text_ar, coalesce(book_name,''), coalesce(grade,''),
               coalesce(text_ru,''), coalesce(text_en,'')
        FROM hadith
        WHERE source=? AND cast(hadith_no as text)=?
        ORDER BY id LIMIT 1
        """,
        (source, str(no)),
    ).fetchone()
    if not row or not (row[0] or "").strip():
        return None
    return {
        "arabic": (row[0] or "").strip(),
        "book": (row[1] or "").strip() or ("Sahih al-Bukhari" if collection == "bukhari" else "Sahih Muslim"),
        "grade": (row[2] or "").strip() or "сахих",
        "ru": (row[3] or "").strip(),
        "en": (row[4] or "").strip(),
    }


def write_catalog_ts(bundle: dict) -> None:
    ts = f"""/** Қазақстандағы сенімді сахих хадистер — қолданба ішінде толық мәтін + дереккөз. */
/* eslint-disable max-lines */
export type KzTrustedHadith = {{
  id: string;
  collection: "bukhari" | "muslim";
  collectionNameKk: string;
  reference: string;
  themeKk: string;
  bookTitleKk: string;
  arabic: string;
  textKk: string;
  grade: string;
  sourceCitationKk: string;
  sourceLabelKk: string;
  sourceNoteKk: string;
  narratorKk: string;
}};

export type KzTrustedHadithBundle = {{
  version: number;
  titleKk: string;
  sourceOrgKk: string;
  itemCount: number;
  items: KzTrustedHadith[];
}};

const BUNDLE = {json.dumps(bundle, ensure_ascii=False, indent=2)} as KzTrustedHadithBundle;

export function getKzTrustedHadithBundle(): KzTrustedHadithBundle {{
  return BUNDLE;
}}

export function getKzTrustedHadithItems(): KzTrustedHadith[] {{
  return BUNDLE.items;
}}

export function findKzTrustedHadith(id: string): KzTrustedHadith | undefined {{
  return BUNDLE.items.find((h) => h.id === id);
}}

export function searchKzTrustedHadiths(query: string, limit = 80): KzTrustedHadith[] {{
  const q = query.trim().toLocaleLowerCase("kk-KZ");
  if (!q) return BUNDLE.items.slice(0, limit);
  const out: KzTrustedHadith[] = [];
  for (const h of BUNDLE.items) {{
    const blob = [h.themeKk, h.textKk, h.sourceCitationKk, h.collectionNameKk, h.reference]
      .join(" ")
      .toLocaleLowerCase("kk-KZ");
    if (blob.includes(q)) {{
      out.push(h);
      if (out.length >= limit) break;
    }}
  }}
  return out;
}}
"""
    CATALOG_TS.write_text(ts, encoding="utf-8")


def merge_seed(new_items: list[dict]) -> int:
    seed = json.loads(SEED.read_text(encoding="utf-8"))
    hadiths = seed.get("hadiths") or []
    by_id = {h.get("id"): i for i, h in enumerate(hadiths)}
    added = 0
    for h in new_items:
        entry = {
            "id": h["id"],
            "collection": h["collection"],
            "collectionNameKk": h["collectionNameKk"],
            "bookTitleKk": h["bookTitleKk"],
            "reference": h["reference"],
            "arabic": h["arabic"],
            "textKk": h["textKk"],
            "narratorKk": h.get("narratorKk") or "",
            "grade": h.get("grade") or "сахих",
            "themeKk": h.get("themeKk") or "",
            "sourceCitationKk": h.get("sourceCitationKk") or "",
            "sourceLabelKk": h.get("sourceLabelKk") or "",
            "sourceNoteKk": h.get("sourceNoteKk") or "",
            "sourceOnly": False,
            "catalogOrigin": "kz-trusted",
            "textRu": "",
            "textEn": "",
            "textTr": "",
        }
        if h["id"] in by_id:
            idx = by_id[h["id"]]
            prev = hadiths[idx]
            # Keep existing locale fields if present
            for k in ("textRu", "textEn", "textTr", "textKy", "textUz"):
                if prev.get(k):
                    entry[k] = prev[k]
            hadiths[idx] = {**prev, **entry, "sourceOnly": False, "catalogOrigin": "kz-trusted"}
        else:
            hadiths.append(entry)
            added += 1
    seed["hadiths"] = hadiths
    seed["count"] = len(hadiths)
    SEED.write_text(json.dumps(seed, ensure_ascii=False), encoding="utf-8")
    return added


def main() -> None:
    ap = argparse.ArgumentParser(
        description=(
            "Expand catalog via RU→KK machine translation. "
            "Blocked by default: product policy ships only scholar/curated KK meanings."
        )
    )
    ap.add_argument("--limit", type=int, default=80, help="Max new hadiths to add")
    ap.add_argument("--sleep", type=float, default=0.08)
    ap.add_argument(
        "--allow-unreviewed-mt",
        action="store_true",
        help="REQUIRED to run: explicitly allow machine-translated KK (not for production).",
    )
    args = ap.parse_args()
    if not args.allow_unreviewed_mt:
        raise SystemExit(
            "Refusing: unreviewed MT Kazakh must not enter the catalog. "
            "Add curated text_kk via build_kz_trusted_hadith_catalog.py CURATED/EXTRA, "
            "or pass --allow-unreviewed-mt only for offline experiments."
        )

    catalog = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    items: list[dict] = list(catalog.get("items") or [])
    existing = {(h["collection"], str(h["reference"])) for h in items}
    cands = json.loads(CANDS.read_text(encoding="utf-8"))
    con = sqlite3.connect(str(DB))

    added_items: list[dict] = []
    failed = 0
    for cand in cands:
        if len(added_items) >= args.limit:
            break
        collection = cand["collection"]
        no = int(cand["no"])
        if (collection, str(no)) in existing:
            continue
        row = fetch_row(con, collection, no)
        if not row:
            continue
        ru = row["ru"]
        if len(ru) < 40:
            continue
        try:
            kk = gtx(ru, "ru", "kk")
            time.sleep(args.sleep)
        except Exception as e:
            failed += 1
            print(f"fail {collection}-{no}: {e}")
            time.sleep(0.5)
            continue
        if not kk or len(kk) < 30:
            failed += 1
            continue
        kk = format_kk_meaning(kk)
        theme = theme_for(ru, row["en"])
        coll_kk = "Сахих әл-Бұхари" if collection == "bukhari" else "Сахих Муслим"
        item = {
            "id": f"{collection}-{no}",
            "collection": collection,
            "collectionNameKk": coll_kk,
            "reference": str(no),
            "themeKk": theme,
            "bookTitleKk": row["book"],
            "arabic": row["arabic"],
            "textKk": kk,
            "grade": row["grade"] if row["grade"] else "сахих",
            "sourceCitationKk": f"{coll_kk}, хадис № {no}",
            "sourceLabelKk": f"{coll_kk} · ҚМДБ сенімді сахих негіз",
            "sourceNoteKk": SOURCE_NOTE,
            "narratorKk": "",
        }
        items.append(item)
        added_items.append(item)
        existing.add((collection, str(no)))
        print(f"+ {item['id']} [{theme}] {kk[:60]}…")

    con.close()
    bundle = {
        "version": int(catalog.get("version") or 1),
        "titleKk": catalog.get("titleKk") or "Сенімді сахих хадистер",
        "sourceOrgKk": catalog.get("sourceOrgKk")
        or "Сахих әл-Бұхари · Сахих Муслим · ҚМДБ сенімді негіз",
        "itemCount": len(items),
        "items": items,
    }
    CATALOG_JSON.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    write_catalog_ts(bundle)
    seed_added = merge_seed(added_items)
    print(
        json.dumps(
            {
                "catalog_total": len(items),
                "newly_added": len(added_items),
                "seed_new_rows": seed_added,
                "failed": failed,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
