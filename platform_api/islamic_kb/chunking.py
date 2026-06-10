# -*- coding: utf-8 -*-
from __future__ import annotations


def chunk_plain_text(text: str, *, max_chars: int = 1800) -> list[str]:
    """Мәтінді абзац шекарасында бөлу."""
    t = (text or "").strip()
    if not t:
        return []
    if len(t) <= max_chars:
        return [t]
    paras = [p.strip() for p in t.split("\n") if p.strip()]
    if not paras:
        paras = [t]
    out: list[str] = []
    buf = ""
    for p in paras:
        if len(p) > max_chars:
            if buf:
                out.append(buf.strip())
                buf = ""
            start = 0
            while start < len(p):
                out.append(p[start : start + max_chars].strip())
                start += max_chars
            continue
        candidate = f"{buf}\n\n{p}".strip() if buf else p
        if len(candidate) <= max_chars:
            buf = candidate
        else:
            if buf:
                out.append(buf.strip())
            buf = p
    if buf:
        out.append(buf.strip())
    return [c for c in out if c]
