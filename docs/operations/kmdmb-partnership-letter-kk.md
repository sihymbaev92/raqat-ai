# ҚМДБ / halaldamu.kz — ресми ынтымақтастық хаты (біріктірілген үлгі)

**Мақсаты:** (1) halaldamu.kz **products API** деректерін толықтыру; (2) Muftyat/Fatua **жаңа мақала** хабарландыруы (RSS/webhook).

**Жіберуші:** RAHAT OMIR / RAQAT командасы  
**Алушы:** ҚМДБ техникалық бөлім / halaldamu.kz / muftyat.kz әкімшілігі  

---

## Тақырып (email)

`RAHAT OMIR — halaldamu products API және Muftyat жаңалық интеграциясы`

---

Құрметті ҚМДБ және halaldamu.kz командасы!

Біз **RAHAT OMIR** (Қазақстан исламдық мобильді қосымша) жобасында:

1. **halaldamu.kz** ресми халал реестрін (`/wp-json/halal-bot/v1/…`) оқу режимінде қолданамыз;  
2. **Fatua.kz** және **Muftyat.kz** мазмұнын ресми рұқсат бойынша индекстеп, сұрақ-жауапта дереккөзбен көрсетеміз (`docs/operations/kmdmb-official-content-license-kk.md`).

Пайдаланушыға әрқашан ресми сайт сілтемесі беріледі; деректерді қайта жарияламаймыз.

---

## 1. halaldamu.kz — өнімдер API (шұғыл)

**Күй (2026-05-30):** мониторинг скрипті `scripts/check_halaldamu_products_api.py`:

| Endpoint | Нәтиже |
|----------|--------|
| `GET …/companies` | ~3765 ұйым, HTTP 200 |
| `GET …/products` | `items: []`, `total: 0` |
| `GET …/products?search=…` | `items: []`, `total: 0` |

**Сұраулар:**

1. `products` API-да деректер қашан толықтырылады? Штрихкод/атау бойынша іздеу жоспары бар ма?  
2. Rate limit нормасы (IP / API кілт) және каталог синхрондауға арналған **кэш TTL** ұсына аласыз ба?  
3. Инкрементті жаңарту: `ETag` / `updated_at` / **webhook** жоспарланбаған ба?  
4. RAQAT-ты ресми серіктес ретінде тіркеу және техникалық байланыс (email/Telegram).

Толық техникалық хат (halal-only): [halaldamu-official-partnership-letter-kk.md](halaldamu-official-partnership-letter-kk.md).

---

## 2. Muftyat.kz / Fatua.kz — жаңа мақала хабарландыруы

Индекстеу қазір **cron** арқылы жүреді (`scripts/run_islamic_kb_sync.sh`, күніне 2 рет + жексенбі толық sync). Жаңа мақала лезде көрінуі үшін:

**Сұраулар:**

1. **RSS/Atom** немесе JSON feed бар ма? (жаңалық, пәтуа, кітап беттері)  
2. Жаңа мақала жарияланғанда **HTTPS webhook** (POST JSON: `url`, `title`, `published_at`, `category`) бере аласыз ба?  
3. IP allowlist / HMAC қолтаңба қажет пе? (біздің шлюз: `https://api.rahatomir.com`)

**Біздің жағы (қабылдауға дайын):**

| Параметр | Мән |
|----------|-----|
| Webhook (ұсыныс) | `POST /api/v1/integrations/muftyat/article-published` |
| Тело | `{ "url", "title", "site": "muftyat"|"fatua", "published_at" }` |
| Әрекет | Бір URL-ді `sync_islamic_kb` queue-ға қою + мобиль push (келешек) |

RSS болса — feed URL-ін жіберсеңіз, біз күніне 1 рет тексереміз (webhook-қа дейін).

---

## 3. Техникалық ақпарат (RAHAT OMIR)

| Қызмет | Мән |
|--------|-----|
| Platform API | `https://api.rahatomir.com` |
| Halal прокси | `GET /api/v1/halal-damu/halal-bot/v1/…` |
| Islamic KB | `GET /api/v1/ai/kb/status`, `GET /api/v1/islamic-kb/…` |
| User-Agent (halal) | `Raqat-Platform/1.0 (Halal Damu proxy)` |
| Мониторинг | `python scripts/check_halaldamu_products_api.py --fail-if-empty` |

Құрметпен,  
**[Аты-жөні]** · **[Лауазым]**  
RAHAT OMIR  
Email: **[email]** · Тел: **[телефон]**  
Сайт: https://rahatomir.com  

---

*Қосымша: `docs/design/halaldamu-p1-wireframe.md`, `data/halaldamu-products-monitor.json` (соңғы тексеру).*
