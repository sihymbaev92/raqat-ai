#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite hadith ↔ RAQAT қолданбасының HadithCorpus JSON синхроны.

Дерекқор атаулары мен provenance: docs/HADITH_DATA_PROVENANCE.md

Экспорт — тек Сахих әл-Бұхари + Сахих Муслим (басқа жинақтар емес), JSON `version: 3`:
  .venv/bin/python scripts/hadith_corpus_sync.py export --db global_clean.db \\
    --out mobile/assets/bundled/hadith-from-db.json
  Тек қазақшасы барлар (жеңіл бандл): сол командаға `--only-with-kk` қосыңыз.
  Толық сахих қамту: `--only-with-kk`-сыз экспортта Бұхари+Муслимнің барлық жолдары (text_kk бос болса да) JSON-ға кіреді; қолданба `hadith-from-db.json` арқылы сидингтеледі.

Импорт — әдепкіде тек сол екі жинақ жолдары жаңартылады:
  .venv/bin/python scripts/hadith_corpus_sync.py import-json --db global_clean.db \\
    --input hadith-from-db.json --dry-run

Статистика (қанша аударылған / қалған):
  .venv/bin/python scripts/hadith_corpus_sync.py stats --db global_clean.db

Толық кесте керек болса (сирек): export --include-all-sources, import-json --all-sources

id форматы: {slug}-{numeric_db_id}, мысалы bukhari-101223, muslim-204400.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.text_cleanup import clean_text_content  # noqa: E402

# handlers/hadith.py және mobile үлгісімен үйлесімді
SOURCE_SLUG: dict[str, str] = {
    "Sahih al-Bukhari": "bukhari",
    "Sahih Muslim": "muslim",
    "Sunan Abi Dawud": "abudawud",
    "Jami` at-Tirmidhi": "tirmidhi",
    "Sunan an-Nasa'i": "nasai",
    "Sunan Ibn Majah": "ibnmajah",
}

SLUG_TO_SOURCE: dict[str, str] = {v: k for k, v in SOURCE_SLUG.items()}

COLLECTION_NAME_KK: dict[str, str] = {
    "bukhari": "Сахих әл-Бұхари",
    "muslim": "Сахих Муслим",
    "abudawud": "Сунан Әбу Дәуд",
    "tirmidhi": "Жәмиғ әт-Тирмизи",
    "nasai": "Сунан ан-Нәсаи",
    "ibnmajah": "Сунан Ибн Мәжа",
}

SAHIH_SOURCES = frozenset({"Sahih al-Bukhari", "Sahih Muslim"})

ID_RE = re.compile(r"^([a-z][a-z0-9]*)-(\d+)$")


def _strip_markdown_light(text: str | None) -> str:
    value = clean_text_content(text)
    if not value:
        return ""
    value = re.sub(r"\*\*(.+?)\*\*", r"\1", value, flags=re.DOTALL)
    value = re.sub(r"^---+\s*$", "", value, flags=re.MULTILINE)
    return clean_text_content(value)


def _slug_for_source(source: str | None) -> str:
    s = (source or "").strip()
    if s in SOURCE_SLUG:
        return SOURCE_SLUG[s]
    safe = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return safe[:48] if safe else "row"


def _collection_field(slug: str) -> str:
    if slug in ("bukhari", "muslim"):
        return slug
    return "other"


def _collection_name_kk(slug: str, source: str | None) -> str:
    if slug in COLLECTION_NAME_KK:
        return COLLECTION_NAME_KK[slug]
    return (source or "Басқа жинақ").strip() or "Басқа жинақ"


def export_rows(
    conn: sqlite3.Connection,
    only_with_kk: bool,
    limit: int | None,
    include_all_sources: bool,
    *,
    include_repeats: bool = False,
) -> list[dict]:
    where = ["1=1"]
    params: list = []
    if not include_all_sources:
        where.append(f"source IN ({','.join('?' * len(SAHIH_SOURCES))})")
        params.extend(sorted(SAHIH_SOURCES))
    if only_with_kk:
        where.append("TRIM(COALESCE(text_kk, '')) <> ''")

    cols = {row[1] for row in conn.execute("PRAGMA table_info(hadith)").fetchall()}
    if "is_repeated" in cols and not include_repeats:
        where.append("COALESCE(is_repeated, 0) = 0")

    sel_cols = "id, source, text_ar, text_kk"
    if "text_kk_literal" in cols:
        sel_cols += ", text_kk_literal"
    if "text_kk_clean" in cols:
        sel_cols += ", text_kk_clean"
    if "text_kk_explanation" in cols:
        sel_cols += ", text_kk_explanation"
    if "translation_status" in cols:
        sel_cols += ", translation_status"
    if "quality_score" in cols:
        sel_cols += ", quality_score"
    if "is_sahih" in cols:
        sel_cols += ", is_sahih"
    if "text_ru" in cols:
        sel_cols += ", text_ru"
    if "text_en" in cols:
        sel_cols += ", text_en"
    sel_cols += ", grade"
    if "is_repeated" in cols:
        sel_cols += ", is_repeated"
    if "original_id" in cols:
        sel_cols += ", original_id"

    limit_sql = f" LIMIT {int(limit)}" if limit else ""
    q = f"""
        SELECT {sel_cols}
        FROM hadith
        WHERE {' AND '.join(where)}
        ORDER BY
          CASE source
            WHEN 'Sahih al-Bukhari' THEN 0
            WHEN 'Sahih Muslim' THEN 1
            ELSE 9
          END,
          id
        {limit_sql}
    """
    rows = conn.execute(q, params).fetchall()
    out: list[dict] = []
    for r in rows:
        src = r["source"] or ""
        slug = _slug_for_source(src)
        hid = f"{slug}-{r['id']}"
        coll = _collection_field(slug)
        text_kk = _strip_markdown_light(r["text_kk"])
        item: dict = {
            "id": hid,
            "dbId": int(r["id"]),
            "collection": coll,
            "collectionNameKk": _collection_name_kk(slug, src),
            "bookTitleKk": "",
            "reference": str(r["id"]),
            "arabic": clean_text_content(r["text_ar"]),
            "textKk": text_kk,
            "narratorKk": "",
            "grade": (r["grade"] or "").strip(),
        }
        if "text_ru" in cols:
            tru = r["text_ru"]
            if tru and str(tru).strip():
                item["textRu"] = _strip_markdown_light(tru)
        if "text_en" in cols:
            ten = r["text_en"]
            if ten and str(ten).strip():
                item["textEn"] = _strip_markdown_light(ten)
        if "is_repeated" in cols:
            item["isRepeated"] = bool(int(r["is_repeated"] or 0))
        if "original_id" in cols and r["original_id"] is not None:
            item["originalDbId"] = int(r["original_id"])
        if "text_kk_literal" in cols and r["text_kk_literal"]:
            item["textKkLiteral"] = _strip_markdown_light(r["text_kk_literal"])
        if "text_kk_clean" in cols and r["text_kk_clean"]:
            item["textKkClean"] = _strip_markdown_light(r["text_kk_clean"])
        if "text_kk_explanation" in cols and r["text_kk_explanation"]:
            item["textKkExplanation"] = _strip_markdown_light(r["text_kk_explanation"])
        if "translation_status" in cols and r["translation_status"] is not None:
            item["translationStatus"] = str(r["translation_status"])
        if "quality_score" in cols and r["quality_score"] is not None:
            item["qualityScore"] = float(r["quality_score"])
        if "is_sahih" in cols and r["is_sahih"] is not None:
            item["isSahih"] = bool(int(r["is_sahih"]))
        out.append(item)
    return out


def cmd_export(args: argparse.Namespace) -> int:
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    try:
        hadiths = export_rows(
            conn,
            args.only_with_kk,
            args.limit,
            args.include_all_sources,
            include_repeats=args.include_repeats,
        )
    finally:
        conn.close()

    scope = "барлық жинақтар" if args.include_all_sources else "тек Сахих Бұхари + Сахих Муслим"
    provenance = {
        "origin": f"RAQAT · SQLite export ({scope})",
        "evidenceKk": "Дерекқордан scripts/hadith_corpus_sync.py export арқылы алынды. dbId — hadith.id.",
        "recordedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "licenseHint": "Түпнұсқа — исламдық жария ілім дәстүрі; қазақша мәтін RAQAT жобасы.",
    }

    corpus = {
        # 3 = толық сахих Бұхари+Муслим (text_kk бос жолдар да, араб толық)
        "version": 3,
        "provenance": provenance,
        "hadiths": hadiths,
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(corpus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(hadiths)} hadiths -> {out_path}")
    return 0


def cmd_stats(args: argparse.Namespace) -> int:
    """Сахих Бұхари/Муслим бойынша text_kk толықтығы (қалған аударма саны)."""
    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    try:
        scope = "барлық hadith кестесі" if args.all_sources else "тек Сахих әл-Бұхари + Сахих Муслим"
        print(f"=== Хадис аударма статистикасы ({scope}) ===\n")
        where = "1=1"
        params: list = []
        if not args.all_sources:
            where = f"source IN ({','.join('?' * len(SAHIH_SOURCES))})"
            params = sorted(SAHIH_SOURCES)

        total_row = conn.execute(
            f"SELECT COUNT(*) AS n FROM hadith WHERE {where}",
            params,
        ).fetchone()
        total = int(total_row["n"] or 0)

        kk_row = conn.execute(
            f"""
            SELECT COUNT(*) AS n FROM hadith
            WHERE {where} AND TRIM(COALESCE(text_kk, '')) <> ''
            """,
            params,
        ).fetchone()
        with_kk = int(kk_row["n"] or 0)
        remaining = max(0, total - with_kk)
        pct = (100.0 * with_kk / total) if total else 0.0

        print(f"Барлығы (сахих жинақтар):     {total}")
        print(f"Қазақша аудармасы бар:       {with_kk}  ({pct:.1f}%)")
        print(f"Аударма қалған (бос text_kk): {remaining}\n")

        by_src = conn.execute(
            f"""
            SELECT source,
                   COUNT(*) AS total,
                   SUM(CASE WHEN TRIM(COALESCE(text_kk, '')) <> '' THEN 1 ELSE 0 END) AS with_kk
            FROM hadith
            WHERE {where}
            GROUP BY source
            ORDER BY source
            """,
            params,
        ).fetchall()
        for row in by_src:
            s = row["source"] or "?"
            t = int(row["total"] or 0)
            w = int(row["with_kk"] or 0)
            r = t - w
            p = (100.0 * w / t) if t else 0.0
            print(f"  • {s}: бар={w}/{t} ({p:.1f}%), қалды={r}")
        print(
            "\nЕскерту: қолданба бандлы (`export --only-with-kk`) тек аудармасы бар "
            "сахих жолдарды алады. Қалғандарды аударған соң `import-json` арқылы DB-ға сіңіріңіз."
        )
    finally:
        conn.close()
    return 0


def cmd_import(args: argparse.Namespace) -> int:
    raw = Path(args.input).read_text(encoding="utf-8")
    data = json.loads(raw)
    hadiths = data.get("hadiths")
    if not isinstance(hadiths, list):
        print("JSON: hadiths array жоқ", file=sys.stderr)
        return 1

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    updated = 0
    skipped = 0
    errors = 0

    try:
        for h in hadiths:
            if not isinstance(h, dict):
                skipped += 1
                continue
            hid = (h.get("id") or "").strip()
            text_kk = _strip_markdown_light(h.get("textKk"))
            text_kk_literal = _strip_markdown_light(h.get("textKkLiteral"))
            text_kk_clean = _strip_markdown_light(h.get("textKkClean"))
            text_kk_explanation = _strip_markdown_light(h.get("textKkExplanation"))
            translation_status = (h.get("translationStatus") or "").strip()
            quality_score = h.get("qualityScore")
            db_id = h.get("dbId")
            m = ID_RE.match(hid)
            if db_id is None and m:
                db_id = int(m.group(2))
            if db_id is None:
                print(f"SKIP (no dbId / id): {hid!r}", file=sys.stderr)
                skipped += 1
                continue

            row = conn.execute(
                "SELECT id, source FROM hadith WHERE id = ?",
                (int(db_id),),
            ).fetchone()
            if not row:
                print(f"MISSING row id={db_id}", file=sys.stderr)
                errors += 1
                continue

            if args.require_slug_match and m:
                slug = m.group(1)
                expected = SLUG_TO_SOURCE.get(slug)
                if expected and (row["source"] or "") != expected:
                    print(
                        f"SKIP source mismatch id={db_id} db={row['source']!r} expected={expected!r}",
                        file=sys.stderr,
                    )
                    skipped += 1
                    continue

            src = (row["source"] or "").strip()
            if not args.all_sources and src not in SAHIH_SOURCES:
                skipped += 1
                continue

            if not args.force and not text_kk.strip():
                skipped += 1
                continue

            if not args.dry_run:
                cols = {row[1] for row in conn.execute("PRAGMA table_info(hadith)").fetchall()}
                sets = ["text_kk = ?", "updated_at = datetime('now')"]
                bind: list = [text_kk]
                if "text_kk_literal" in cols and text_kk_literal:
                    sets.append("text_kk_literal = ?")
                    bind.append(text_kk_literal)
                if "text_kk_clean" in cols and text_kk_clean:
                    sets.append("text_kk_clean = ?")
                    bind.append(text_kk_clean)
                if "text_kk_explanation" in cols and text_kk_explanation:
                    sets.append("text_kk_explanation = ?")
                    bind.append(text_kk_explanation)
                if "translation_status" in cols and translation_status:
                    sets.append("translation_status = ?")
                    bind.append(translation_status)
                if "quality_score" in cols and quality_score is not None:
                    try:
                        bind.append(float(quality_score))
                        sets.append("quality_score = ?")
                    except Exception:
                        pass
                bind.append(int(db_id))
                conn.execute(
                    f"UPDATE hadith SET {', '.join(sets)} WHERE id = ?",
                    tuple(bind),
                )
            updated += 1

        if not args.dry_run:
            conn.commit()
    finally:
        conn.close()

    print(f"import-json: updated={updated} skipped={skipped} errors={errors} dry_run={args.dry_run}")
    return 1 if errors and not args.allow_errors else 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Hadith DB ↔ HadithCorpus JSON sync")
    sub = p.add_subparsers(dest="cmd", required=True)

    pe = sub.add_parser("export", help="SQLite → JSON (әдепкі: тек сахих Бұхари+Муслим)")
    pe.add_argument("--db", default=str(ROOT / "global_clean.db"))
    pe.add_argument("--out", required=True, help="Output JSON path")
    pe.add_argument(
        "--include-all-sources",
        action="store_true",
        help="Сунан және басқа жинақтарды да қосу (ұзақ JSON)",
    )
    pe.add_argument(
        "--only-with-kk",
        action="store_true",
        help="Тек text_kk толық жолдар (қолданбаға жеңіл бандл)",
    )
    pe.add_argument("--limit", type=int, default=0, help="0 = шектеусіз")
    pe.add_argument(
        "--include-repeats",
        action="store_true",
        help="Кітап ішіндегі қайталанатын жолдарды да экспорттау (әдепкі: тек бірегей is_repeated=0)",
    )
    pe.set_defaults(func=cmd_export)

    pi = sub.add_parser("import-json", help="JSON → SQLite (text_kk жаңарту)")
    pi.add_argument("--db", default=str(ROOT / "global_clean.db"))
    pi.add_argument("--input", required=True)
    pi.add_argument("--dry-run", action="store_true")
    pi.add_argument(
        "--force",
        action="store_true",
        help="Бос text_kk бар жолдарды да жазу",
    )
    pi.add_argument(
        "--require-slug-match",
        action="store_true",
        help="id слагын дерекқордағы source-пен салыстыру (қауіпсіздік)",
    )
    pi.add_argument("--allow-errors", action="store_true", help="Жол табылмаса да exit 0")
    pi.add_argument(
        "--all-sources",
        action="store_true",
        help="Сахих емес жинақ жолдарын да жаңарту (әдепкі: тек Бұхари/Муслим)",
    )
    pi.set_defaults(func=cmd_import)

    ps = sub.add_parser(
        "stats",
        help="DB бойынша сахих хадистердің қазақша аударма саны / қалғаны",
    )
    ps.add_argument("--db", default=str(ROOT / "global_clean.db"))
    ps.add_argument(
        "--all-sources",
        action="store_true",
        help="Сунан және басқа жинақтарды да санау",
    )
    ps.set_defaults(func=cmd_stats)

    return p


def main() -> int:
    args = build_parser().parse_args()
    if hasattr(args, "limit") and args.limit == 0:
        args.limit = None
    return int(args.func(args))


if __name__ == "__main__":
    sys.exit(main())
