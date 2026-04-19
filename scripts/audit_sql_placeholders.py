#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SQLite `?` плейсхолдерлерін PostgreSQL `%s` / named params көшіруіне дайындық аудиті.

Толық автоматты рефакторинг қауіпті (f-string, шартты SQL). Бұл скрипт **күдікті**
жолдарды тізіп шығады — өзгерістер қолмен ревьюмен.

Мысал:
  python scripts/audit_sql_placeholders.py
  python scripts/audit_sql_placeholders.py --roots db platform_api handlers services
"""
from __future__ import annotations

import argparse
import ast
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SQL_HINTS = ("SELECT", "INSERT", "UPDATE", "DELETE", "FROM ", "INTO ", "WHERE ", "PRAGMA")


def _sql_like(s: str) -> bool:
    u = s.upper()
    return "?" in s and any(h in u for h in SQL_HINTS)


def _scan_file(path: Path) -> list[tuple[int, str]]:
    try:
        src = path.read_text(encoding="utf-8")
    except OSError:
        return []
    try:
        tree = ast.parse(src, filename=str(path))
    except SyntaxError:
        return [(1, "<syntax error: skip>")]
    out: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            s = node.value
            if _sql_like(s):
                line = getattr(node, "lineno", 0) or 0
                snippet = " ".join(s.split())[:120]
                out.append((line, snippet))
        elif isinstance(node, ast.JoinedStr):
            if any(
                isinstance(p, ast.Constant) and isinstance(p.value, str) and "?" in p.value
                for p in node.values
                if isinstance(p, ast.Constant)
            ):
                line = getattr(node, "lineno", 0) or 0
                out.append((line, "<f-string SQL: manual review>"))
    return out


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--roots",
        nargs="*",
        default=["db", "platform_api", "handlers", "services"],
        help="Қалталар (репо түбінен)",
    )
    args = p.parse_args()
    roots = [ROOT / r for r in args.roots]
    total_files = 0
    hits = 0
    for root in roots:
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*.py")):
            if "venv" in path.parts or ".venv" in path.parts:
                continue
            total_files += 1
            findings = _scan_file(path)
            if not findings:
                continue
            hits += 1
            rel = path.relative_to(ROOT)
            print(f"\n== {rel} ==")
            for line, snip in findings:
                print(f"  L{line}: {snip}")
    print(f"\nSummary: {hits} files with SQL+? hints (scanned {total_files} .py under roots).", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
