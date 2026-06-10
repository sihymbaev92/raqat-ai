# Islamic knowledge base (RAG)

Қысқа инженерлік карта. Толық саясат және фазалар: **[RAQAT_ISLAMIC_KNOWLEDGE_RAG.md](../RAQAT_ISLAMIC_KNOWLEDGE_RAG.md)**.

## Қазіргі код

| Компонент | Жол |
|-----------|-----|
| Пакет | `platform_api/islamic_kb/` — SQLite + FTS5, ingest, `rag.py` |
| Sync | `scripts/sync_islamic_kb_fatua.py`, `scripts/sync_islamic_kb_muftyat.py` |
| DB | `data/islamic_kb.sqlite3` (`RAQAT_ISLAMIC_KB_DB_PATH`) |
| AI | `ai_proxy.py` — `build_islamic_kb_context`; `RAQAT_ISLAMIC_KB_ENABLED=1` |
| API | `GET /api/v1/ai/kb/status`, `GET /api/v1/ai/kb/search?q=`; жауапта `sources[]` |
| Sync CLI | `scripts/sync_islamic_kb.py --site all` |
| **VPS бірінші sync** | **[operations/islamic-kb-vps-sync.md](../operations/islamic-kb-vps-sync.md)** |
| Cron shell | `scripts/run_islamic_kb_sync.sh` |
| Мобильді іздеу | `IslamicKbSearch` экраны (үзінді + «Толық оқу») |
| Мобильді | `mobile/src/services/platformApiClient.ts` |
| Тест | `tests/test_islamic_kb_search.py` |

## Env (мысал)

`.env.example`, `infra/docker/platform-api.env.example` — `RAQAT_ISLAMIC_KB_*`.

## Мобильді өзгеріс

[mobile/changelog/2026-05-16.md](../mobile/changelog/2026-05-16.md) § Platform.

[← platform_api/README.md](README.md)
