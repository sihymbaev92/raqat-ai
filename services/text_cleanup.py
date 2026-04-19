# -*- coding: utf-8 -*-
import re

INVISIBLE_REPLACEMENTS = {
    "\ufeff": "",
    "\u200b": "",
    "\u200c": "",
    "\u200d": "",
    "\u2060": "",
    "\xa0": " ",
    "�": "",
}


def clean_text_content(text: str | None) -> str:
    value = text or ""
    for old, new in INVISIBLE_REPLACEMENTS.items():
        value = value.replace(old, new)

    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]{2,}", " ", value)
    value = re.sub(r" *\n *", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()
