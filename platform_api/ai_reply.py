# -*- coding: utf-8 -*-
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class AiReplyResult:
    text: str
    sources: list[dict] = field(default_factory=list)
