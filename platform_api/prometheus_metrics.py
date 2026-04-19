# -*- coding: utf-8 -*-
"""Prometheus метрикалары: RPS/error rate (counter), AI latency (histogram)."""
from __future__ import annotations

import re
from typing import TYPE_CHECKING

from prometheus_client import Counter, Histogram

if TYPE_CHECKING:
    pass

_UUID_RE = re.compile(
    r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}",
    re.I,
)


def normalize_path_for_metrics(path: str) -> str:
    """Жолдық кардиналдылықты шектеу: UUID → :uuid, ұзын сан тізбектерін қысқарту."""
    p = path or ""
    if len(p) > 120:
        p = p[:117] + "..."
    p = _UUID_RE.sub(":uuid", p)
    p = re.sub(r"/\d{3,}", "/:id", p)
    return p


HTTP_REQUESTS = Counter(
    "raqat_http_requests_total",
    "HTTP сұраулары (rate() → req/s)",
    ["method", "path", "status_class"],
)

HTTP_ERRORS = Counter(
    "raqat_http_errors_total",
    "HTTP сервер қателері (5xx; error rate үшін rate() қолдану)",
    ["status_class"],
)

HTTP_LATENCY = Histogram(
    "raqat_http_request_duration_seconds",
    "HTTP сұрау уақыты",
    ["method", "path"],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0),
)

AI_CHAT_SECONDS = Histogram(
    "raqat_ai_chat_duration_seconds",
    "AI чат генерациясы уақыты (Gemini; exact/semantic cache қағып қалған сәттер есептелмейді)",
    buckets=(0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0),
)


def status_class(code: int) -> str:
    if code >= 500:
        return "5xx"
    if code >= 400:
        return "4xx"
    if code >= 300:
        return "3xx"
    return "2xx"


def observe_http(*, method: str, path: str, status_code: int, duration_sec: float) -> None:
    p = normalize_path_for_metrics(path)
    sc = status_class(status_code)
    HTTP_REQUESTS.labels(method=method, path=p, status_class=sc).inc()
    if status_code >= 500:
        HTTP_ERRORS.labels(status_class=sc).inc()
    HTTP_LATENCY.labels(method=method, path=p).observe(duration_sec)


def observe_ai_chat(duration_sec: float) -> None:
    AI_CHAT_SECONDS.observe(duration_sec)
