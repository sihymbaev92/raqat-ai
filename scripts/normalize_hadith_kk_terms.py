#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Normalize glossary variants in hadith bundled textKk."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db.json"
DEFAULT_GLOSSARY = ROOT / "scripts" / "hadith_kk_glossary.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def replace_word(text: str, source: str, target: str) -> tuple[str, int]:
    pat = re.compile(rf"\b{re.escape(source)}\b", flags=re.IGNORECASE)
    return pat.subn(target, text)


def main() -> int:
    p = argparse.ArgumentParser(description="Normalize hadith textKk variants by glossary.")
    p.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    p.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    data = load_json(args.bundle)
    gl = load_json(args.glossary)
    hadiths = data.get("hadiths") or []
    preferred_terms = gl.get("preferred_terms") or {}

    changed_rows = 0
    changed_tokens = 0

    for row in hadiths:
        kk = str(row.get("textKk") or "")
        original = kk
        for preferred, variants in preferred_terms.items():
            if not isinstance(preferred, str) or not isinstance(variants, list):
                continue
            for v in variants:
                if not isinstance(v, str) or not v:
                    continue
                kk, n = replace_word(kk, v, preferred)
                changed_tokens += n
        if kk != original:
            row["textKk"] = kk
            changed_rows += 1

    print(f"changed_rows: {changed_rows}")
    print(f"changed_tokens: {changed_tokens}")
    if not args.dry_run:
        args.bundle.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"written: {args.bundle}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
