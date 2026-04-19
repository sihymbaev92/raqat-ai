# -*- coding: utf-8 -*-
"""
RAQAT платформа API — минималды MVP.
Келешекте: дерек оқу, AI прокси (Bot→API→AI), auth, профиль, тарих.
"""
from __future__ import annotations

import logging
import os
import sys
from contextlib import asynccontextmanager
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter, time as wall_time

_ROOT = Path(__file__).resolve().parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

try:
    from dotenv import load_dotenv

    load_dotenv(_ROOT / ".env")
except ImportError:
    pass

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from db.migrations import run_schema_migrations
from db.get_db import close_postgresql_pools, is_postgresql_configured, sqlite_database_path
from db_reader import get_content_stats, readiness_ping
from prometheus_metrics import observe_http
from ai_routes import router as ai_router
from auth_routes import router as auth_router
from content_routes import router as content_router
from community_routes import router as community_router
from progress_routes import router as progress_router
from roadmap_routes import router as roadmap_router
from usage_routes import router as usage_router

APP_NAME = "RAQAT Platform API"
VERSION = "0.1.0"
BOT_URL = os.getenv("RAQAT_BOT_URL", "https://t.me/my_islamic_ai_bot")
DOCS_URL = (os.getenv("RAQAT_DOCS_URL") or "").strip()
logger = logging.getLogger("raqat_platform_api")
_LATENCY_SAMPLES = deque(maxlen=5000)
_PROCESS_START_WALL = wall_time()
_HTTP_5XX_TOTAL = 0


def _percentile(sorted_values: list[float], p: float) -> float:
    if not sorted_values:
        return 0.0
    idx = int(round((p / 100.0) * (len(sorted_values) - 1)))
    idx = max(0, min(idx, len(sorted_values) - 1))
    return float(sorted_values[idx])

def _require_redis_or_exit() -> None:
    """Өндірісте Redis міндетті — жоқ болса процесс тоқтайды (`RAQAT_REDIS_REQUIRED=0` — тек тест/dev)."""
    if os.getenv("RAQAT_REDIS_REQUIRED", "1").strip().lower() in ("0", "false", "no", "off"):
        return
    try:
        from app.infrastructure.redis_client import get_redis_client

        if get_redis_client() is None:
            logger.critical(
                "FATAL: Redis required (RAQAT_REDIS_URL) but connection failed. "
                "Set RAQAT_REDIS_REQUIRED=0 only for local tests."
            )
            sys.exit(1)
    except SystemExit:
        raise
    except Exception as exc:
        logger.critical("FATAL: Redis startup check failed: %s", exc)
        sys.exit(1)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Startup schema gate:
    - Redis міндетті (өндіріс): RAQAT_REDIS_URL қолжетімді болуы керек.
    - SQLite mode: apply versioned migrations before serving traffic.
    - PostgreSQL mode: skip SQLite migrations (handled by PG migration path/tooling).
    """
    _require_redis_or_exit()
    if is_postgresql_configured():
        logger.info("Startup schema gate: PostgreSQL mode detected, skipping SQLite migrations.")
        from db.community_schema import ensure_community_tables
        from db.dialect_sql import is_psycopg_connection
        from db.get_db import get_db
        from db.oauth_phone_schema import ensure_oauth_phone_tables
        from db.user_data_schema import ensure_user_data_tables

        def _pg_commit_if_needed(conn) -> None:
            if is_psycopg_connection(conn):
                try:
                    conn.commit()
                except Exception:
                    logger.exception("PostgreSQL: commit after DDL failed")

        # Әр схеманы бөлек: бірі қателессе, қауым дұға кестелері бар болуы мүмкін.
        try:
            with get_db() as conn:
                ensure_community_tables(conn)
                _pg_commit_if_needed(conn)
            logger.info("PostgreSQL: community_dua / community_dua_amen tables OK.")
        except Exception:
            logger.exception("PostgreSQL: ensure_community_tables failed")

        try:
            with get_db() as conn:
                ensure_user_data_tables(conn)
                _pg_commit_if_needed(conn)
            logger.info("PostgreSQL: user_data tables OK.")
        except Exception:
            logger.exception("PostgreSQL: ensure_user_data_tables failed")

        try:
            with get_db() as conn:
                ensure_oauth_phone_tables(conn)
                _pg_commit_if_needed(conn)
            logger.info("PostgreSQL: oauth_phone tables OK.")
        except Exception:
            logger.exception("PostgreSQL: ensure_oauth_phone_tables failed")
    else:
        db_path = sqlite_database_path()
        run_schema_migrations(db_path)
        logger.info("Startup schema gate: SQLite migrations are up to date (%s).", db_path)
    try:
        yield
    finally:
        # Close optional PostgreSQL pools to avoid leaked connections on stop/reload.
        close_postgresql_pools()


app = FastAPI(title=APP_NAME, version=VERSION, lifespan=lifespan)
app.include_router(auth_router)
app.include_router(ai_router)
app.include_router(content_router)
app.include_router(community_router)
app.include_router(progress_router)
app.include_router(roadmap_router)
app.include_router(usage_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_timing_middleware(request: Request, call_next):
    started = perf_counter()
    response = await call_next(request)
    elapsed_ms = (perf_counter() - started) * 1000.0
    elapsed_sec = elapsed_ms / 1000.0
    global _HTTP_5XX_TOTAL
    if int(response.status_code) >= 500:
        _HTTP_5XX_TOTAL += 1
    response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.1f}"
    path = request.url.path
    if path not in ("/metrics", "/metrics/json"):
        observe_http(
            method=request.method or "GET",
            path=path,
            status_code=int(response.status_code),
            duration_sec=elapsed_sec,
        )
    _LATENCY_SAMPLES.append(
        {
            "t": datetime.now(timezone.utc).isoformat(),
            "path": path,
            "method": request.method,
            "status": int(response.status_code),
            "duration_ms": float(elapsed_ms),
        }
    )
    logger.info(
        "http_request method=%s path=%s status=%s duration_ms=%.1f",
        request.method,
        path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.get("/health")
def health():
    return {"status": "ok", "service": APP_NAME, "version": VERSION}


@app.get("/ready")
def ready():
    """Дерекқорға қосылу (readiness). `/health` — тек процесс тірі."""
    r = readiness_ping()
    body = {**r, "service": APP_NAME, "version": VERSION}
    if not r.get("ok"):
        return JSONResponse(status_code=503, content=body)
    return body


@app.get("/api/v1/info")
def info():
    return {
        "name": APP_NAME,
        "version": VERSION,
        "time_utc": datetime.now(timezone.utc).isoformat(),
        "links": {
            "telegram_bot": BOT_URL.strip(),
            **({"docs": DOCS_URL} if DOCS_URL else {}),
        },
        "note_kk": (
            "Liveness: GET /health. Readiness (DB): GET /ready. "
            "Оқу-only: /api/v1/stats/content. "
            "AI: X-Raqat-Ai-Secret немесе JWT. "
            "Тарих: GET /api/v1/users/me/history. "
            "Телеграм байлау: POST /api/v1/auth/link/telegram."
        ),
    }


@app.get("/api/v1/stats/content")
def stats_content():
    """Хадис пен Құран кестелерінің жол саны (тек оқу)."""
    return get_content_stats()


@app.get("/metrics")
def metrics_prometheus():
    """Prometheus scrape: rate(raqat_http_requests_total[1m]) → req/s; AI histogram."""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/metrics/json")
def metrics_json():
    """JSON терезесі (интерактивті тексеру). Prometheus: GET /metrics."""
    rows = list(_LATENCY_SAMPLES)
    uptime_s = wall_time() - _PROCESS_START_WALL
    base_meta = {
        "uptime_seconds": round(uptime_s, 3),
        "uptime_human": f"{int(uptime_s // 3600)}h{int((uptime_s % 3600) // 60)}m{int(uptime_s % 60)}s",
        "http_5xx_total": _HTTP_5XX_TOTAL,
    }
    if not rows:
        return {
            "ok": True,
            **base_meta,
            "window_size": 0,
            "latency_ms": {"p50": 0.0, "p95": 0.0, "p99": 0.0, "avg": 0.0},
            "slow_over_2000ms": 0,
            "paths": [],
            "note": "Logs: uvicorn/logger 'http_request'. Errors: http_5xx_total.",
        }

    durations = sorted(float(r["duration_ms"]) for r in rows)
    avg = sum(durations) / len(durations)
    slow = sum(1 for d in durations if d > 2000.0)

    by_path: dict[str, list[float]] = {}
    for r in rows:
        by_path.setdefault(str(r["path"]), []).append(float(r["duration_ms"]))

    path_items = []
    for path, vals in by_path.items():
        svals = sorted(vals)
        path_items.append(
            {
                "path": path,
                "count": len(svals),
                "p95_ms": round(_percentile(svals, 95), 1),
                "avg_ms": round(sum(svals) / len(svals), 1),
            }
        )
    path_items.sort(key=lambda x: x["p95_ms"], reverse=True)

    return {
        "ok": True,
        **base_meta,
        "window_size": len(durations),
        "latency_ms": {
            "p50": round(_percentile(durations, 50), 1),
            "p95": round(_percentile(durations, 95), 1),
            "p99": round(_percentile(durations, 99), 1),
            "avg": round(avg, 1),
        },
        "slow_over_2000ms": slow,
        "paths": path_items[:20],
        "note": "Logs: uvicorn/logger 'http_request'. Errors: http_5xx_total (server-side).",
    }
