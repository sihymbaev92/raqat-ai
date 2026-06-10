# -*- coding: utf-8 -*-
"""AI exact cache keys, flush, and chat write-through hook (Sprint 1 #106)."""
from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "platform_api"))

from db.migrations import run_schema_migrations
from db.platform_identity_chat import append_ai_exchange


class _FakeRedis:
    def __init__(self) -> None:
        self.store: dict[str, str] = {}

    def get(self, key: str):
        return self.store.get(key)

    def setex(self, key: str, _ttl: int, value: str) -> None:
        self.store[key] = value

    def delete(self, key: str) -> int:
        if key in self.store:
            del self.store[key]
            return 1
        return 0

    def scan_iter(self, match: str, count: int = 200):
        prefix = match.rstrip("*")
        for k in list(self.store.keys()):
            if k.startswith(prefix):
                yield k


class TestAiExactCache(unittest.TestCase):
    def setUp(self) -> None:
        self.redis = _FakeRedis()
        self.get_patcher = patch(
            "app.infrastructure.redis_client.get_redis_client",
            return_value=self.redis,
        )
        self.get_patcher.start()
        os.environ.pop("RAQAT_AI_EXACT_CACHE", None)

    def tearDown(self) -> None:
        self.get_patcher.stop()

    def test_cache_key_prefix_and_roundtrip(self) -> None:
        from ai_exact_cache import EXACT_CACHE_KEY_PREFIX, cache_get_reply, cache_key_for_prompt, cache_set_reply

        prompt = "Намаз уақыты"
        key = cache_key_for_prompt(prompt)
        self.assertTrue(key.startswith(EXACT_CACHE_KEY_PREFIX))
        cache_set_reply(prompt, "Жауап мысалы")
        self.assertEqual(cache_get_reply(prompt), "Жауап мысалы")

    def test_flush_prefix_removes_stale_entry(self) -> None:
        from ai_exact_cache import cache_flush_prefix, cache_get_reply, cache_set_reply

        cache_set_reply("есki сұрақ", "есki жауап")
        self.assertIsNotNone(cache_get_reply("есki сұрақ"))
        n = cache_flush_prefix()
        self.assertGreaterEqual(n, 1)
        self.assertIsNone(cache_get_reply("есki сұрақ"))

    def test_invalidate_single_prompt(self) -> None:
        from ai_exact_cache import cache_get_reply, cache_invalidate_prompt, cache_set_reply

        cache_set_reply("a", "one")
        cache_set_reply("b", "two")
        self.assertTrue(cache_invalidate_prompt("a"))
        self.assertIsNone(cache_get_reply("a"))
        self.assertEqual(cache_get_reply("b"), "two")

    def test_flush_all_ai_includes_semantic(self) -> None:
        from ai_exact_cache import cache_flush_all_ai, cache_set_reply
        from ai_semantic_cache import SEMANTIC_CACHE_KEY, cache_set_semantic

        os.environ["RAQAT_AI_SEMANTIC_CACHE"] = "0"
        cache_set_reply("q", "r")
        self.redis.store[SEMANTIC_CACHE_KEY] = json.dumps([{"e": [1.0], "t": "x"}])
        stats = cache_flush_all_ai()
        self.assertGreaterEqual(stats["exact_deleted"], 1)
        self.assertEqual(stats["semantic_flushed"], 1)
        self.assertNotIn(SEMANTIC_CACHE_KEY, self.redis.store)


class TestAiCacheInvalidationHook(unittest.TestCase):
    def setUp(self) -> None:
        self.redis = _FakeRedis()
        self.get_patcher = patch(
            "app.infrastructure.redis_client.get_redis_client",
            return_value=self.redis,
        )
        self.get_patcher.start()
        os.environ.pop("RAQAT_AI_EXACT_CACHE", None)

    def tearDown(self) -> None:
        self.get_patcher.stop()

    def test_append_ai_exchange_refreshes_cache(self) -> None:
        import sqlite3

        from ai_exact_cache import cache_get_reply, cache_set_reply

        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name
        run_schema_migrations(db_path)
        pid = "11111111-1111-4111-8111-111111111111"
        with sqlite3.connect(db_path) as conn:
            conn.execute(
                """
                INSERT INTO platform_identities (platform_user_id, created_at, updated_at)
                VALUES (?, datetime('now'), datetime('now'))
                """,
                (pid,),
            )
            conn.commit()
        cache_set_reply("сұрақ", "есki кэш")
        append_ai_exchange(db_path, pid, "сұрақ", "жаңа жауап DB-ден", source="api")
        self.assertEqual(cache_get_reply("сұрақ"), "жаңа жауап DB-ден")


if __name__ == "__main__":
    unittest.main()
