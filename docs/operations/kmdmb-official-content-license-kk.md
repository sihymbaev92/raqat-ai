# ҚМДБ — Fatua.kz / Muftyat.kz мазмұнын RAQAT-қа көшіру рұқсаты

**Күй:** ресми рұқсат берілді (ҚМДБ / Muftyat / Fatua).

---

## Не рұқсат етілді

- Fatua.kz және Muftyat.kz **мәтін мазмұнын** RAQAT платформасы мен мобильді қолданбаға **индекстеу және көрсету**
- Пәтуалар, мақалалар, жаңалықтар, **ресми кітап беттері** (HTML мәтін бар бөліктер)
- AI RAG және қолданба ішіндегі іздеу/оқу

## Не сақталуы керек (attribution)

- Әр материалда **canonical URL** және **дереккөз атауы** (Fatua.kz / Muftyat.kz)
- `license_note` — SQLite `islamic_kb_documents` кестесінде (`RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE=1`)
- Визуалды бренд/design mirror емес — мәтін + сілтеме

## Техникалық іске қосу

`.env`:

```env
RAQAT_ISLAMIC_KB_ENABLED=1
RAQAT_ISLAMIC_KB_OFFICIAL_LICENSE=1
RAQAT_ISLAMIC_KB_DB_PATH=/opt/raqat-ai/data/islamic_kb.sqlite3
RAQAT_ISLAMIC_KB_SOURCES=fatua,muftyat
# Толық синхрон (бір рет, VPS-те):
# RAQAT_ISLAMIC_KB_SYNC_MAX_URLS=10000
# RAQAT_ISLAMIC_KB_FETCH_DELAY_SEC=1.0
# RAQAT_ISLAMIC_KB_EXCERPT_CHARS=1200
```

Бірінші толық индекстеу:

```bash
python scripts/sync_islamic_kb.py --site all --full
```

Күйін тексеру:

```bash
python -c "from pathlib import Path; import sys; sys.path.insert(0,'platform_api'); from islamic_kb.db import kb_stats; print(kb_stats())"
```

Күн сайын ж incremental sync: `./scripts/run_islamic_kb_sync.sh --site all --max 500`

## Құжаттау (хат/келісім)

Ресми хат немесе email көшірмесін осы қалтаға сақтаңыз (мысалы `data/legal/kmdmb-content-license-2026.pdf` — `.gitignore`).

| Өріс | Мән |
|------|-----|
| Беруші | ҚМДБ / Muftyat / Fatua |
| Алушы | RAQAT / RAHAT OMIR |
| Көлем | мәтін индекстеу, AI, мобильді |
| Күні | *(хаттағы күн)* |

## Islam.kz / Muslim.kz

Бұл рұқсат **Fatua + Muftyat** үшін. Islam.kz / Muslim.kz хадис скрейпі — бөлек келісім немесе ашық API (fawaz hadith-api) арқылы.
