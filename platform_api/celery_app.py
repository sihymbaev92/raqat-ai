# -*- coding: utf-8 -*-
"""
Celery қолданбасы — TTS, сурет талдау, fanout сияқты ауыр тапсырмаларға (келесі фаза).

Іске қосу (platform_api қалтасынан):
  celery -A celery_app worker --loglevel=info

Docker: `docker compose --profile workers up` (`infra/docker/docker-compose.yml`).
"""
from __future__ import annotations

import os

from celery import Celery


def _int_env(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _broker_url() -> str:
    return (
        os.getenv("RAQAT_CELERY_BROKER_URL")
        or os.getenv("RAQAT_REDIS_URL")
        or "redis://127.0.0.1:6379/0"
    ).strip()


def _result_backend() -> str:
    return (os.getenv("RAQAT_CELERY_RESULT_BACKEND") or _broker_url()).strip()


app = Celery(
    "raqat",
    broker=_broker_url(),
    backend=_result_backend(),
)
_result_ttl = _int_env("RAQAT_CELERY_RESULT_EXPIRES_SEC", 3600)
_visibility = _int_env("RAQAT_CELERY_VISIBILITY_TIMEOUT_SEC", 7200)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    task_ignore_result=False,
    broker_connection_retry_on_startup=True,
    task_track_started=True,
    task_time_limit=_int_env("RAQAT_CELERY_TASK_TIME_LIMIT_SEC", 600),
    task_soft_time_limit=_int_env("RAQAT_CELERY_TASK_SOFT_TIME_LIMIT_SEC", 540),
    result_expires=_result_ttl,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_default_retry_delay=_int_env("RAQAT_CELERY_DEFAULT_RETRY_DELAY_SEC", 30),
    task_max_retries=_int_env("RAQAT_CELERY_TASK_MAX_RETRIES", 5),
    broker_transport_options={
        "visibility_timeout": _visibility,
        "retry_on_timeout": True,
        "socket_keepalive": True,
        "health_check_interval": 30,
    },
)


@app.task(name="raqat.ping")
def ping() -> str:
    """Денсаулық тексеру / compose smoke."""
    return "pong"


# Тапсырмаларды тіркеу (circular import: celery_tasks ішінде app импортталады)
import celery_tasks  # noqa: E402,F401
