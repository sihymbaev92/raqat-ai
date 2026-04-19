from __future__ import annotations

import os
from dataclasses import dataclass

from app.infrastructure.redis_url import normalize_redis_url


@dataclass(frozen=True)
class Settings:
    app_name: str = "RAQAT Platform API"
    version: str = "1.0.0"
    api_prefix: str = "/api/v1"
    cors_origins: tuple[str, ...] = ("*",)
    db_path: str = "../global_clean.db"
    redis_url: str = "redis://localhost:6379/0"
    queue_backend: str = "celery"
    failover_mode: str = "graceful"

    @classmethod
    def from_env(cls) -> "Settings":
        origins = tuple(
            item.strip() for item in os.getenv("CORS_ORIGINS", "*").split(",") if item.strip()
        ) or ("*",)
        return cls(
            app_name=os.getenv("RAQAT_APP_NAME", cls.app_name),
            version=os.getenv("RAQAT_APP_VERSION", cls.version),
            api_prefix=os.getenv("RAQAT_API_PREFIX", cls.api_prefix),
            cors_origins=origins,
            db_path=os.getenv("RAQAT_DB_PATH", os.getenv("DB_PATH", cls.db_path)),
            redis_url=normalize_redis_url(os.getenv("RAQAT_REDIS_URL", cls.redis_url)),
            queue_backend=os.getenv("RAQAT_QUEUE_BACKEND", cls.queue_backend),
            failover_mode=os.getenv("RAQAT_FAILOVER_MODE", cls.failover_mode),
        )


settings = Settings.from_env()

