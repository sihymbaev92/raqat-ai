#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Glossary/style validator for bundled hadith Kazakh text."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BUNDLE = ROOT / "mobile" / "assets" / "bundled" / "hadith-from-db.json"
DEFAULT_GLOSSARY = ROOT / "scripts" / "hadith_kk_glossary.json"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    p = argparse.ArgumentParser(description="Validate hadith textKk with glossary/style rules.")
    p.add_argument("--bundle", type=Path, default=DEFAULT_BUNDLE)
    p.add_argument("--glossary", type=Path, default=DEFAULT_GLOSSARY)
    p.add_argument("--top", type=int, default=20)
    p.add_argument("--strict", action="store_true", help="Exit non-zero when issues are found.")
    p.add_argument(
        "--enforce-variants",
        action="store_true",
        help="In strict mode, fail on preferred_terms variant hits too.",
    )
    args = p.parse_args()

    if not args.bundle.is_file():
        print(f"Bundle not found: {args.bundle}", file=sys.stderr)
        return 1
    if not args.glossary.is_file():
        print(f"Glossary not found: {args.glossary}", file=sys.stderr)
        return 1

    data = load_json(args.bundle)
    gl = load_json(args.glossary)
    hadiths = data.get("hadiths") or []
    preferred_terms = gl.get("preferred_terms") or {}
    forbidden_patterns = gl.get("forbidden_patterns") or []

    bad_forbidden: list[tuple[str, str]] = []
    bad_variants: list[tuple[str, str, str]] = []

    compiled_forbidden = [re.compile(re.escape(x), re.I) for x in forbidden_patterns if isinstance(x, str) and x]

    for h in hadiths:
        hid = str(h.get("id") or "")
        kk = str(h.get("textKk") or "")
        if not hid or not kk:
            continue
        for pat in compiled_forbidden:
            if pat.search(kk):
                bad_forbidden.append((hid, pat.pattern))
                break
        for preferred, variants in preferred_terms.items():
            if not isinstance(preferred, str) or not isinstance(variants, list):
                continue
            for v in variants:
                if not isinstance(v, str) or not v:
                    continue
                if re.search(rf"\b{re.escape(v)}\b", kk, flags=re.I):
                    bad_variants.append((hid, v, preferred))

    print(f"forbidden_hits: {len(bad_forbidden)}")
    for hid, pat in bad_forbidden[: max(0, args.top)]:
        print(f"  {hid}: forbidden '{pat}'")
    print(f"variant_hits: {len(bad_variants)}")
    for hid, v, preferred in bad_variants[: max(0, args.top)]:
        print(f"  {hid}: '{v}' -> '{preferred}'")

    if args.strict and bad_forbidden:
        return 2
    if args.strict and args.enforce_variants and bad_variants:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
