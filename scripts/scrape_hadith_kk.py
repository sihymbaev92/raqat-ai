#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Хадис скрейп — этикалық KK дереккөздер + ашық API корпус.

Ережелер (Ethics of Crawling):
  • Әр сұраныстан кейін кідіріс (--delay, әдепкі 1.5 с)
  • Алдымен --test (бір URL), содан --crawl
  • HTML тазартылады — тек plain text
  • source_url міндетті (provenance)

Толық Сахих Бұхари/Муслим (араб + en + ru):
  scripts/import_hadith_from_open_sources.py — fawaz hadith-api (сайтқа жүктеме жоқ)

KK сайттардан үзінділер:
  python scripts/scrape_hadith_kk.py test --url https://islam.kz/kk/articles/.../
  python scripts/scrape_hadith_kk.py crawl --site islam --max-pages 2 --delay 1.5
  python scripts/scrape_hadith_kk.py stats
  python scripts/scrape_hadith_kk.py export --out data/scraped_hadith.json

Сайт әкімшілігіне алдын ала хабарлау ұсынылады (IP блоктан сақтау).
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from hadith_scrape.config import default_db_path, fetch_delay_sec, max_pages_default  # noqa: E402
from hadith_scrape.db import connect, export_json, stats, upsert_rows  # noqa: E402
from hadith_scrape.extract import extract_from_html  # noqa: E402
from hadith_scrape.fetch import fetch_html, site_from_url  # noqa: E402
from hadith_scrape.sources import crawl_site, seed_urls_for_site  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("scrape_hadith_kk")


def cmd_test(args: argparse.Namespace) -> int:
    url = args.url.strip()
    site = args.site or site_from_url(url)
    logger.info("TEST fetch %s (site=%s, delay=%ss)", url, site, args.delay)
    html = fetch_html(url, delay=0)
    rows = extract_from_html(html, source_url=url, source_site=site)
    print(f"extracted={len(rows)} site={site}")
    for i, row in enumerate(rows[:5], 1):
        print(f"\n--- #{i} id={row.hadith_id}")
        print(f"narrator: {row.narrator or '—'}")
        print(f"collection: {row.collection_hint or '—'}")
        print(row.hadith_text[:500] + ("…" if len(row.hadith_text) > 500 else ""))
    if args.save:
        conn = connect(Path(args.db))
        ins, skip = upsert_rows(conn, rows)
        print(f"saved inserted={ins} skipped={skip}")
    return 0 if rows else 1


def cmd_crawl(args: argparse.Namespace) -> int:
    conn = connect(Path(args.db))
    sites = ["fatua", "muftyat", "islam", "muslim"] if args.site == "all" else [args.site]
    total_ins = 0
    total_skip = 0
    for site in sites:
        if args.url:
            urls = [args.url]
        else:
            urls = crawl_site(
                site,
                max_pages=args.max_pages,
                delay=args.delay,
                hadith_only=args.hadith_only,
                max_urls=args.max_urls,
            )
            if not urls:
                urls = seed_urls_for_site(site)
        logger.info("site=%s urls=%d delay=%ss", site, len(urls), args.delay)
        for n, url in enumerate(urls, 1):
            try:
                html = fetch_html(url, delay=args.delay)
                rows = extract_from_html(html, source_url=url.split("#")[0], source_site=site)
                ins, skip = upsert_rows(conn, rows)
                total_ins += ins
                total_skip += skip
                logger.info("[%d/%d] %s rows=%d +%d skip=%d", n, len(urls), url[:80], len(rows), ins, skip)
            except Exception as exc:
                logger.warning("fail %s: %s", url, exc)
            if args.test and n >= 1:
                break
    print("done inserted=", total_ins, "skipped=", total_skip)
    print("stats:", stats(conn))
    return 0


def cmd_stats(args: argparse.Namespace) -> int:
    conn = connect(Path(args.db))
    print(json.dumps(stats(conn), ensure_ascii=False, indent=2))
    return 0


def cmd_export(args: argparse.Namespace) -> int:
    conn = connect(Path(args.db))
    rows = export_json(conn)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(rows)} rows -> {out}")
    return 0


def cmd_import_open(args: argparse.Namespace) -> int:
    import subprocess

    cmd = [
        sys.executable,
        str(ROOT / "scripts" / "import_hadith_from_open_sources.py"),
        "--db",
        args.db_main,
        "--books",
        args.books,
    ]
    if args.replace:
        cmd.extend(["--replace", "--i-understand"])
    print("Running:", " ".join(cmd))
    return subprocess.call(cmd)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Ethical hadith scrape + open API import helper")
    p.add_argument("--db", default=str(default_db_path()), help="scraped_hadith SQLite path")
    sub = p.add_subparsers(dest="cmd", required=True)

    t = sub.add_parser("test", help="Бір URL — экстракция тесті (жаппай crawl алдында)")
    t.add_argument("--url", required=True)
    t.add_argument("--site", choices=("fatua", "muftyat", "islam", "muslim"))
    t.add_argument("--delay", type=float, default=fetch_delay_sec())
    t.add_argument("--save", action="store_true", help="SQLite-қа сақтау")
    t.set_defaults(func=cmd_test)

    c = sub.add_parser("crawl", help="Сайт(тар) бойынша crawl")
    c.add_argument("--site", choices=("fatua", "muftyat", "islam", "muslim", "all"), default="islam")
    c.add_argument("--url", help="Бір URL ғана")
    c.add_argument("--max-pages", type=int, default=max_pages_default())
    c.add_argument("--max-urls", type=int, default=0, help="Max мақала URL (0 = max-pages×40)")
    c.add_argument(
        "--hadith-only",
        action="store_true",
        help="URL slug-ında hadis/hadith/хадис барлар ғана (Muftyat/Fatua)",
    )
    c.add_argument("--delay", type=float, default=fetch_delay_sec())
    c.add_argument("--test", action="store_true", help="Site бойынша тек 1 URL")
    c.set_defaults(func=cmd_crawl)

    s = sub.add_parser("stats", help="SQLite статистика")
    s.set_defaults(func=cmd_stats)

    e = sub.add_parser("export", help="JSON экспорт")
    e.add_argument("--out", default=str(ROOT / "data" / "scraped_hadith.json"))
    e.set_defaults(func=cmd_export)

    o = sub.add_parser(
        "import-open",
        help="Толық Сахих корпус — fawaz API (сайт скрейп емес)",
    )
    o.add_argument("--db-main", default=str(ROOT / "global_clean.db"))
    o.add_argument("--books", default="bukhari,muslim")
    o.add_argument("--replace", action="store_true")
    o.set_defaults(func=cmd_import_open)

    return p


def main() -> int:
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8")
    args = build_parser().parse_args()
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
