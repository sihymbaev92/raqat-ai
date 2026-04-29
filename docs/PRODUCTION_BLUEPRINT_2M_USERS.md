# RAQAT production blueprint (2M+ users)

Бұл құжат — жобаны масштабтауға арналған **нақты архитектуралық карта** (кеңес емес, орындалатын нұсқа). FastAPI production-та container және multi-worker режимде жақсы қолданылады; PostgreSQL HA үшін primary/standby және replication; Redis — distributed rate limit/cache; Celery — Redis broker/backend, retry/reconnect.

Қолданыстағы жоғары деңгейлі сипаттама: [`RAQAT_V1_TECHNICAL_ARCHITECTURE.md`](./RAQAT_V1_TECHNICAL_ARCHITECTURE.md), платформа handoff: [`PLATFORM_GPT_HANDOFF.md`](./PLATFORM_GPT_HANDOFF.md).

**Репозиторийдегі орындалған карта:** түбірде [`ECOSYSTEM.md`](../ECOSYSTEM.md), [`apps/`](../apps/), [`packages/`](../packages/), [`infra/docker/`](../infra/docker/).

---

## 1. Негізгі принцип

Экожүйенің өзегі:

```text
Clients → Gateway → Platform API → Postgres / Redis / Queue / Search / Object Storage
```

Telegram bot, mobile app, web app — тек **кіру нүктелері**. Негізгі ақыл, user identity, Quran/Hadith truth, AI orchestration, safety, logging, billing, analytics — **орталық backend**-та.

- API **stateless** болуы керек.
- Startup/shutdown ресурстарын **FastAPI lifespan** арқылы басқаруға болады.
- Deployment-та **бірнеше worker/process** ұсынылады.

---

## 2. Репо қалай бөлінуі керек

Бірден микросервиске секірмеу — **modular monolith**:

```text
raqat/
  apps/
    api/
    bot/
    mobile/
    web/
    admin/
  packages/
    core/
    auth/
    quran/
    hadith/
    ai/
    prayer/
    qibla/
    notifications/
    billing/
    observability/
  infra/
    docker/
    k8s/
    nginx/
    scripts/
  docs/
```

- `apps/api` — **карта**; нақты Platform API коды [`platform_api/`](../platform_api/), іске қосу: `scripts/run_platform_api.sh` немесе `apps/api/dev.sh` / `apps/api/dev.ps1`.
- `packages/*` — домендік модульдер (бір кодбаза, таза шекара, қарапайым deploy).

---

## 3. Міндетті сервистер (логикалық модульдер)

Басында:

- auth, users, identities, quran, hadith, ai_orchestrator, prayer, qibla, notifications, audit, usage.

Кейін бөлек service болатындар:

- ai_workers, search, analytics, billing.

**Heavy** процестерді request path-тан шығару: TTS, image analysis, bulk translation, notification fanout, reindexing — **Celery** (retry, reconnect, Redis broker/backend).

---

## 4. Міндетті инфрақұрылым

| Қабат | Технология |
|--------|-------------|
| API | FastAPI, Uvicorn/Gunicorn workers |
| Database | PostgreSQL primary + кемінде 1 standby, **PgBouncer** |
| Cache / coordination | **Redis** |
| Async | **Celery + Redis** |
| Storage | S3-compatible object storage |
| Search | басында PostgreSQL FTS; кейін OpenSearch / Elasticsearch немесе vector index |
| Monitoring | Prometheus, Grafana, Sentry, орталық логтар |

---

## 5. Желілік сызба

```text
[Telegram Bot] ----\
[Mobile App] -------\
[Web App] -----------> [Cloudflare / CDN / WAF] -> [Nginx / Traefik] -> [Platform API Pods]
[Admin Panel] ------/

[Platform API Pods] -> [PgBouncer] -> [PostgreSQL Primary]
[Platform API Pods] -> [Redis]
[Platform API Pods] -> [Object Storage]
[Platform API Pods] -> [Search Engine — опция]

[Celery Workers] -> [Redis] -> [PostgreSQL]
[Celery Workers] -> [Object Storage]

[Read-only queries] -> [Postgres Read Replica]  (кейін)
```

**Bottleneck-тер:** DB connection, AI latency, notification fanout, search. PgBouncer қысымды азайтады; Redis cache/rate-limit request path-ты жеңілдетеді.

---

## 6. Пайдаланушы моделі

Негізгі truth — **бір `platform_user_id`**.

Кестелер мысалы:

- users  
- identities  
- sessions  
- refresh_tokens  
- devices  

`identities` ішінде (барлығы бір `user_id`-ға):

- telegram_user_id  
- phone / email  
- apple_sub, google_sub  
- anonymous_device_id  

JWT access token қысқа; refresh token **rotate**. Session state — **DB/Redis**, API pod ішінде тұрмайды.

---

## 7. Дерекқор схемасы (мақсатты)

### Quran

**quran_surahs**

- id, surah_number, name_ar, name_kk, name_ru, name_en, ayah_count  

**quran_ayahs**

- id, surah_number, ayah_number, juz, hizb, page  
- arabic_text, transliteration, text_kk, text_ru, text_en, tafsir_short_kk  
- audio_url, updated_at  

Индекстер: `unique (surah_number, ayah_number)`; мәтіндік іздеу индекстері.

### Hadith

**hadith_collections** — id, code, name, reliability_policy  

**hadith_items** — id, collection_id, book_no, chapter_no, hadith_no, arabic_text, text_kk, text_ru, text_en, grade_label, reliability_class, warning_text, updated_at  

`reliability_class` мысалы: sahih_primary, sahih_secondary, weak, disputed.

### Басқа

bookmarks, prayer_profiles, notification_preferences, usage_events, audit_logs, jobs.

---

## 8. API endpoint картасы (мақсатты)

**Auth**

- `POST /api/v1/auth/login`  
- `POST /api/v1/auth/refresh`  
- `POST /api/v1/auth/link/telegram`  
- `POST /api/v1/auth/logout`  
- `GET /api/v1/users/me`  

**Quran**

- `GET /api/v1/quran/surahs`  
- `GET /api/v1/quran/surahs/{surah}/ayahs`  
- `GET /api/v1/quran/surahs/{surah}/ayahs/{ayah}`  
- `GET /api/v1/quran/search`  

**Hadith**

- `GET /api/v1/hadith/collections`  
- `GET /api/v1/hadith/search`  
- `GET /api/v1/hadith/{hadith_id}`  
- `GET /api/v1/hadith/random`  

**AI**

- `POST /api/v1/ai/chat`  
- `POST /api/v1/ai/analyze-image`  
- `POST /api/v1/ai/transcribe-voice`  
- `POST /api/v1/ai/tts`  

**Worship**

- `GET /api/v1/prayer/times`  
- `GET /api/v1/qibla`  
- `GET /api/v1/daily/ayah`  

**User content**

- `GET /api/v1/users/me/history`  
- `POST /api/v1/bookmarks`  
- `GET /api/v1/bookmarks`  

**Ops**

- `GET /health`  
- `GET /ready`  
- `GET /metrics`  

Readiness / startup — operational concerns ретінде бекіту керек.

---

## 9. AI orchestration

AI ешқашан «таза LLM» болмауы керек.

Pipeline:

```text
Request → Router → Retrieval → Policy → Cache → Generator → Post-processor → Logger
```

**Router:** Quran lookup, Hadith lookup, Prayer/Qibla tool, AI chat, image, voice.

**Retrieval:** Quran ayah, sahih hadith, curated canonical answer, user context.

**Policy:** unsourced fatwa, disputed hadith, harmful content, certainty төмен.

**Cache:** exact, semantic, canonical answer bank.

**Generator:** қысқа, source-first.

---

## 10. ~1.2 с жауап үшін fast-path қабаттары

Барлық сұрақ 1.2 сек болмайды; 70–80% үшін мақсат қоюға болады.

- **L1** exact cache («Фатиха сүресі», «сабыр туралы аят», «Шымкент намаз уақыты»).  
- **L2** semantic cache.  
- **L3** canonical curated answers (сабыр, тәубе, ризық, ата-ана, жүрек тыныштығы).  
- **L4** retrieval + compact generation.  
- **L5** heavy async/streaming (image, TTS, күрделі reasoning).

Redis — distributed low-latency cache, hot read path.

---

## 11. Құбыла сервисі

Үш бөлік:

1. Kaaba bearing calculation  
2. Device heading integration  
3. UX honesty  

**API:** lat, lon, bearing_to_kaaba, distance_km, timezone, calibration_needed.

**Mobile:** magnetometer smoothing, poor accuracy warning, recalibration UX.

**Тәртіп:** server calculation = truth; device = orientation ғана; формула бірдей, UI құрылғыға сай.

---

## 12. Намаз сервисі

**Input:** lat/lon, city, timezone, calculation method, madhhab, high latitude rule, date.

**Output:** fajr, sunrise, dhuhr, asr, maghrib, isha.

**Өнімдік:** бүгін/ертеңгі уақытты алдын ала есептеп cache; notification scheduler түнде дайындау; client тек display.

---

## 13. Redis не үшін міндетті

1. Rate limiting  
2. Session/cache  
3. Hot Quran/Hadith cache  
4. Semantic cache  
5. Idempotency keys  
6. Queue broker/backing  

Distributed rate limiting: fixed/sliding/token bucket; Lua script — TOCTOU race азайту.

---

## 14. Queue бөлінісі

**Кезектер** (бір үлкен емес):

- critical_notifications  
- tts_jobs  
- image_analysis  
- reindex_jobs  
- bulk_translation  
- analytics_events  

**Worker pool:** lightweight | media | AI-heavy.

Recoverable error → Celery `retry()`.

---

## 15. 2M user bottleneck-тер

Ең қауіпті:

- DB connections  
- AI provider latency  
- N+1 queries  
- hot endpoints without cache  
- broadcast notifications  
- object upload bottlenecks  
- long sync tasks in request path  

**Шаралар:** PgBouncer, query profiling, Redis hot cache, async workers, CDN, object storage direct upload, backpressure / 429.

---

## 16. Қауіпсіздік

- JWT refresh rotation  
- Secret manager  
- Signed internal secrets  
- Admin RBAC  
- Audit logs  
- Prompt injection protection  
- Upload MIME validation  
- Per-IP / per-user / per-device rate limits  
- AI source provenance  

**Діни AI:** фатуа режимі жоқ; disputed hadith белгіленген; source жоқ болса жауап шектеледі; certainty төмен — disclaimer.

---

## 17. Monitoring және resilience

**Metric-тер:** request latency p50/p95/p99, cache hit rate, DB pool saturation, queue backlog, AI provider error rate, Redis memory, notification success rate, crash-free sessions, Qibla sensor failure rate, prayer calculation failures.

Әр сервис **timeout**-қа ие болуы керек; бір құласа, бүкіл жүйе құламауы тиіс.

---

## 18. Deploy стратегиясы

**Dev:** Docker Compose — api, postgres, redis, worker, bot, admin.

**Staging:** production-like, бөлек DB, бөлек Redis, smoke tests, synthetic traffic.

**Production:** Cloudflare/WAF, load balancer, бірнеше API instance, PgBouncer, Postgres primary+standby, Redis, Celery workers, object storage, monitoring stack.

---

## 19. Build order (орындалу реті)

1. PostgreSQL-ге толық көшу  
2. SQLAlchemy + Alembic schema  
3. Redis қосу  
4. exact cache + rate limiting  
5. Celery queue  
6. AI orchestration policy layer  
7. Admin audit panel  
8. read replicas / search / semantic cache  
9. autoscaling / HA / failover drills  

Алдымен truth пен жылдамдық негізі, содан кейін scale мен intelligence.

---

## 20. Қысқа инженерлік формула

| Қабат | Рөлі |
|--------|------|
| Platform API | ми |
| PostgreSQL | шындық |
| Redis | жылдамдық |
| Celery | тұрақтылық |
| Search | табу |
| Object storage | медиа |
| Audit / Policy | сенім |
| Bot / Mobile / Web | кіру есігі |

**Нәтиже:** тез жауап, құбыла адал, намаз нақты, AI source-first, 2M user-ге scale болатын экожүйе.

---

*Құжат репозиторияға сақталған нұсқа; инфрақұрылым вендорларының ресми құжаттарымен (PostgreSQL HA, Redis rate limit, FastAPI/Uvicorn deployment, Celery retry) үйлестіру production кезінде міндетті.*
