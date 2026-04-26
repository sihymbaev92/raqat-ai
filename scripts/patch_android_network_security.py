#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTTP API хосттарын `mobile/android/.../network_security_config.xml` ішіне қосады
(release APK cleartext allowlist).

1) `RAQAT_ANDROID_CLEARTEXT_HOSTS` — үтірмен бөлінген хосттар: алдымен орта айнымалы, әйтпесе түбір/ `mobile/.env`.
2) Әйтпесе `EXPO_PUBLIC_RAQAT_API_BASE` — орта, содан .env, тек `http://` hostname.
3) `.env` ішіндегі `mobile` мәндері бірдей кілтте түбірді басып тұрады.

HTTPS-only болса хост қосылмайды (skip). Қайта орындау idempotent.

Қолдану: репо түбірінен `python scripts/patch_android_network_security.py`
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse


def _configure_stdio_utf8() -> None:
    """Windows cp1251 консолында қазақша print үшін."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _parse_dotenv(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, _, v = line.partition("=")
        key = k.strip()
        val = v.strip().strip('"').strip("'")
        if key:
            out[key] = val
    return out


def _merged_dotenv() -> dict[str, str]:
    root = _repo_root()
    merged: dict[str, str] = {}
    merged.update(_parse_dotenv(root / ".env"))
    merged.update(_parse_dotenv(root / "mobile" / ".env"))
    return merged


def _hosts_from_env() -> list[str]:
    merged = _merged_dotenv()
    explicit = (
        os.environ.get("RAQAT_ANDROID_CLEARTEXT_HOSTS")
        or merged.get("RAQAT_ANDROID_CLEARTEXT_HOSTS")
        or ""
    ).strip()
    if explicit:
        return [x.strip() for x in explicit.split(",") if x.strip()]

    base = (
        os.environ.get("EXPO_PUBLIC_RAQAT_API_BASE")
        or merged.get("EXPO_PUBLIC_RAQAT_API_BASE")
        or ""
    ).strip()
    if base:
        p = urlparse(base)
        if p.scheme.lower() == "http" and p.hostname:
            return [p.hostname]
    return []


def _existing_domains(xml: str) -> set[str]:
    found = re.findall(r"<domain[^>]*>([^<]+)</domain>", xml, flags=re.I)
    return {x.strip().lower() for x in found if x.strip()}


def _patch(xml_path: Path, hosts: list[str]) -> tuple[bool, list[str]]:
    text = xml_path.read_text(encoding="utf-8")
    have = _existing_domains(text)
    to_add: list[str] = []
    for h in hosts:
        hn = h.strip()
        if not hn:
            continue
        if hn.lower() not in have:
            to_add.append(hn)
            have.add(hn.lower())
    if not to_add:
        return False, []

    block = "".join(
        f'\n    <domain includeSubdomains="false">{h}</domain>' for h in to_add
    )
    marker = "</domain-config>"
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit(f"XML ішінде {marker!r} табылмады: {xml_path}")
    new_text = text[:idx] + block + "\n" + text[idx:]
    xml_path.write_text(new_text, encoding="utf-8")
    return True, to_add


def main() -> int:
    _configure_stdio_utf8()
    root = _repo_root()
    xml_path = (
        root
        / "mobile"
        / "android"
        / "app"
        / "src"
        / "main"
        / "res"
        / "xml"
        / "network_security_config.xml"
    )
    if not xml_path.is_file():
        print(f"Табылмады: {xml_path}", file=sys.stderr)
        return 1

    hosts = _hosts_from_env()
    if not hosts:
        print(
            "cleartext patch: еш хост жоқ (HTTPS немесе EXPO_PUBLIC_RAQAT_API_BASE/RAQAT_ANDROID_CLEARTEXT_HOSTS бос). "
            "HTTP үшін .env немесе орта айнымалыларын толтырыңыз."
        )
        return 0

    changed, added = _patch(xml_path, hosts)
    if changed:
        print(f"cleartext patch OK: {xml_path.relative_to(root)} <- {', '.join(added)}")
    else:
        print(f"cleartext patch: барлық хосттар XML-де бар болды — {', '.join(hosts)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
