# VPS: бірінші Islamic KB синхрондау (Fatua.kz + Muftyat.kz)

Бұл runbook — **бірінші рет** `scripts/sync_islamic_kb.py --site all` іске қосу және `platform_api` RAG-ты қосу.

**Жылдам production (бір команда):** `bash scripts/bootstrap_islamic_kb_production.sh` — `.env` patch, `--full` sync, cron (күніне 2× incremental + жексенбі full).

**Құқық:** толық mirror емес; үзінді + сілтеме. Толық саясат: [RAQAT_ISLAMIC_KNOWLEDGE_RAG.md](../RAQAT_ISLAMIC_KNOWLEDGE_RAG.md).

---

## 0. Не керек

| Талап | Түсіндірме |
|--------|------------|
| VPS | Интернет шығысы (Fatua/Muftyat HTTPS) |
| Репо | Мысалы `/opt/raqat-ai` |
| Python 3.11+ | `platform_api` venv |
| Диск | `data/islamic_kb.sqlite3` (~几 MB–几十 MB, мақала санына байланысты) |
| API қайта іске қосу | `.env` өзгергеннен кейін `systemctl restart` |

API кілті **міндетті емес** синхронға; **міндетті** AI жауап үшін: `GEMINI_API_KEY`.

---

## 1. SSH және репо

```bash
ssh user@your-vps
cd /opt/raqat-ai   # өз жолыңыз
git pull           # соңғы код (islamic_kb + sync скрипт)
```

---

## 2. Venv және тәуелділіктер

```bash
cd /opt/raqat-ai/platform_api
python3 -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -r requirements.txt
```

Синхрон **түбір** `.env` оқиды (`python-dotenv`). `httpx` жеткілікті (HTML тазалау — `islamic_kb/html_cleaner.py`, BeautifulSoup міндетті емес).

---

## 3. `.env` — Islamic KB жолдары

Түбірде `/opt/raqat-ai/.env` (немесе `platform_api/.env` — sync түбір `.env` жүктейді):

```bash
nano /opt/raqat-ai/.env
```

Қосыңыз (жолдарды түзетіңіз):

```env
# --- Islamic KB (Fatua + Muftyat) ---
RAQAT_ISLAMIC_KB_ENABLED=1
RAQAT_ISLAMIC_KB_DB_PATH=/opt/raqat-ai/data/islamic_kb.sqlite3
RAQAT_ISLAMIC_KB_SOURCES=fatua,muftyat
RAQAT_ISLAMIC_KB_TOP_K=5
RAQAT_ISLAMIC_KB_MAX_CONTEXT_CHARS=9000
RAQAT_ISLAMIC_KB_SYNC_MAX_URLS=80
RAQAT_ISLAMIC_KB_FETCH_DELAY_SEC=1.2
RAQAT_ISLAMIC_KB_EXCERPT_CHARS=280
```

| Айнымалы | Мағынасы |
|----------|----------|
| `ENABLED=1` | AI чатта RAG контекст |
| `DB_PATH` | SQLite индекс файлы (бір файл — көшіру/backup оңай) |
| `SYNC_MAX_URLS` | Бір сайтқа бір sync-те max мақала (бірінші рет 80–150 ұсынылады) |
| `FETCH_DELAY_SEC` | Сайттар арасында кідіріс (rate limit) |

`data/` қалтасын жасаңыз:

```bash
mkdir -p /opt/raqat-ai/data
chmod 755 /opt/raqat-ai/data
```

---

## 4. Бірінші синхрон (негізгі команда)

Репо **түбірінен** (PATH `platform_api` скрипт ішінде қосылады):

```bash
cd /opt/raqat-ai
source platform_api/.venv/bin/activate

# Барлық сайт (Fatua + Muftyat), сайт сайын ~80 URL
python scripts/sync_islamic_kb.py --site all --max 80
```

**Күтілетін шығыс (мысал):**

```
fatua {'site': 'fatua', 'attempted': 80, 'indexed': 12, 'unchanged': 0, 'errors': 68, ...}
muftyat {'site': 'muftyat', 'attempted': 80, 'indexed': 8, ...}
kb_stats: {'documents': 20, 'chunks': 45, 'by_site': {'fatua': 12, 'muftyat': 8}}
```

`errors` жоғары болуы мүмкін (sitemap-та мақала емес URL, 403, қысқа HTML). **Бірнеше ондаған `indexed`** болса — MVP үшін жеткілікті.

### Бір мақаланы қолмен сынау

```bash
python scripts/sync_islamic_kb.py --site fatua --url "https://fatua.kz/kk/post/123"
```

### Тек бір сайт

```bash
python scripts/sync_islamic_kb.py --site fatua --max 50
python scripts/sync_islamic_kb.py --site muftyat --max 50
```

### Ұзақ sync (screen)

```bash
sudo apt install -y screen   # болмаса
screen -S islamic-kb
cd /opt/raqat-ai && source platform_api/.venv/bin/activate
python scripts/sync_islamic_kb.py --site all --max 150
# Ctrl+A, D — фонда қалдыру; screen -r islamic-kb — қайта кіру
```

---

## 5. Индексті тексеру (серверде)

```bash
cd /opt/raqat-ai
source platform_api/.venv/bin/activate
python -c "
from islamic_kb.db import kb_stats, ensure_db
from islamic_kb.config import islamic_kb_db_path
from islamic_kb.search import search_islamic_kb_articles
ensure_db()
print('db:', islamic_kb_db_path())
print('stats:', kb_stats())
print('search:', search_islamic_kb_articles('намаз', limit=3))
"
```

---

## 6. Platform API қайта іске қосу

`RAQAT_ISLAMIC_KB_*` оқылуы үшін API процесін қайта қосыңыз.

**systemd** (мысал `raqat-platform-api`):

```bash
sudo systemctl restart raqat-platform-api
sudo systemctl status raqat-platform-api --no-pager
```

`EnvironmentFile=/opt/raqat-ai/.env` systemd unit-те болуы керек ([үлгі](../../scripts/systemd/raqat-platform-api.service.example)).

**Docker** болса — контейнер `.env` томын жаңартып `docker compose restart platform-api`.

---

## 7. HTTPS арқылы API тексеру

`API` — сыртқы URL (мысал `https://api.example.kz`). AI endpoint қорғалған — `X-Raqat-Ai-Secret` немесе JWT.

```bash
export API="https://api.example.kz"
export SECRET="your_RAQAT_AI_PROXY_SECRET"   # .env-тегі мән

# Индекс күйі
curl -sS -H "X-Raqat-Ai-Secret: $SECRET" "$API/api/v1/ai/kb/status" | python3 -m json.tool

# Іздеу (мобильді экран да осыны қолданады)
curl -sS -G -H "X-Raqat-Ai-Secret: $SECRET" \
  --data-urlencode "q=намаз" \
  --data-urlencode "limit=5" \
  "$API/api/v1/ai/kb/search" | python3 -m json.tool
```

Күтілетіні: `enabled: true`, `documents` > 0, `results[]` ішінде `title`, `excerpt`, `url`.

**Мобильді:** Баптаулар → платформа API → сол `API` URL → RAQAT AI → «Пәтуа іздеу».

---

## 8. Күніне 2 рет жаңарту (cron)

```bash
sudo bash /opt/raqat-ai/scripts/install_islamic_kb_cron_twice_daily.sh
```

Немесе қолмен:

```cron
# 04:15 UTC + 16:15 UTC (≈ 09:15 / 21:15 Астана)
15 4 * * * cd /opt/raqat-ai && /opt/raqat-ai/scripts/run_islamic_kb_sync.sh --site all --max 120 >> /var/log/raqat-islamic-kb-sync.log 2>&1
15 16 * * * cd /opt/raqat-ai && /opt/raqat-ai/scripts/run_islamic_kb_sync.sh --site all --max 120 >> /var/log/raqat-islamic-kb-sync.log 2>&1
```

---

## 9. Жиі қателер

| Белгі | Шешім |
|--------|--------|
| `documents: 0` | Sync қате аяқталды; интернет, sitemap, `--max`; қолмен `--url` сынаңыз |
| `kb/status` enabled false | `.env`-те `RAQAT_ISLAMIC_KB_ENABLED=1`, API restart |
| 404 `/ai/kb/search` | API коды ескі — `git pull` + restart |
| Көп `errors` sync-те | Қалыпты; `FETCH_DELAY_SEC` арттырыңыз (2–3); `MAX_URLS` азайтыңыз |
| 403 / Cloudflare | Кідіріс арттыру; кейін proxy/residential IP (күрделі) |
| Muftyat `500` articles/news | Trailing slash: `/kk/articles/` (жоқ `/kk/articles`); sitemap.xml серверде 500 — listing pagination |
| AI дереккөз жоқ | `ENABLED=1` + `documents`>0; Gemini кілті бар ма тексеріңіз |

---

## 10. Backup

```bash
cp -a /opt/raqat-ai/data/islamic_kb.sqlite3 \
      /opt/raqat-ai/data/islamic_kb.sqlite3.bak.$(date +%F)
```

Кейін PostgreSQL/pgvector — бөлек фаза ([RAQAT_ISLAMIC_KNOWLEDGE_RAG.md](../RAQAT_ISLAMIC_KNOWLEDGE_RAG.md)).

[← operations/README.md](README.md) · [platform_api/islamic-kb-rag.md](../platform_api/islamic-kb-rag.md)
