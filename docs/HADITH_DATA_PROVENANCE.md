# Хадис дерекқоры — қай кітап, қай жол, қалай сақталады

Бұл құжат **репозиторийдегі нақты модельді** сипаттайды: қай бағана не үшін, `source` жолы қалай **дәл** жазылуы керек, JSON/мобильді бандл қалай үйлеседі. Сыртқы «түпкізден басылым» лицензиясы — **өнім/құқық командасы** растауы тиіс; кодта URL-мен бір жапсырма лицензия жоқ.

---

## 1. SQLite / PostgreSQL кестесі `hadith`

| Бағана | Мазмұны |
|--------|---------|
| `id` | Біріншілік кілт (сан). Мобильді JSON-да **басқа пішін**: `{slug}-{id}` (төмен §3). |
| `source` | Жинақ атауы **ағылшынша тұрақты жол** — төмен §2 кестесімен **байланыссыз өзгертуге болмайды** (бот, API, FTS, синк скрипттері сұрауда сол мәтінді қолданады). |
| `grade` | Дәреже мәтіні (`sahih`, `hasan`, …) — іздеу/сұрыптау үшін; **Сахих әл-Бұхари / Сахих Муслим** жинақтарында жиі бос болуы мүмкін, бірақ `source` бойынша «кітап тұтастай сахих» логикасы жұмыс істейді. |
| `text_ar` | Арабша риуаят мәтіні (негізгі көз). |
| `text_kk` | Қазақша аударма (Gemini батч скрипттері + қолмен түзету; толықтығы DB бойынша өзгереді). |
| `text_ru`, `text_en` | Орыс/ағылшынша аудармалар; **интернеттен толтыру**: `scripts/fill_hadith_text_fawaz.py` (fawazahmed0/hadith-api, jsDelivr). |
| `updated_at` | Инкременттік синхрон (`/metadata/changes`) үшін. |

---

## 2. `source` мәндері — дәл осы жолдар

Кодта (`handlers/hadith.py`, `scripts/hadith_corpus_sync.py`, `platform_api/content_reader.py` т.б.) келесі **түпнұсқа атаулар** күтіледі:

| `source` (DB мәнінің дәл жазылуы) | Қолданбадағы атау (КК) | `slug` (JSON / синк) |
|-----------------------------------|-------------------------|----------------------|
| `Sahih al-Bukhari` | Сахих әл-Бұхари | `bukhari` |
| `Sahih Muslim` | Сахих Муслим | `muslim` |
| `Sunan Abi Dawud` | Сунан Әбу Дәуд | `abudawud` |
| `Jami' at-Tirmidhi` | Жәмиғ әт-Тирмизи | `tirmidhi` |
| `Sunan an-Nasa'i` | Сунан ан-Нәсаи | `nasai` |
| `Sunan Ibn Majah` | Сунан Ибн Мәжа | `ibnmajah` |

**Ескерту:** `Sunan an-Nasa'i` ішіндегі апостроф (`'`) — SQL/Python string-те экрандауға мұқият болыңыз.

**Сахих бөлім (бот UI):** тек `Sahih al-Bukhari` және `Sahih Muslim` — `STRICT_SAHIH_SOURCES` / `SAHIH_SOURCES` (`hadith_corpus_sync.py`).

---

## 3. JSON корпус (`HadithCorpus`) және `id`

- Скрипт: `scripts/hadith_corpus_sync.py` — экспорт/импорт, `stats`.
- JSON `version: 3` (экспорт докстрингте сипатталған).
- Сыртқы идентификатор: **`{slug}-{numeric_db_id}`**, мысалы `bukhari-101223`, `muslim-204400` (`hadith_corpus_sync.py` бастапқы түсініктемесі).

---

## 3б. Бос немесе қайта құру: ашық API-дан толық импорт (араб + en + ru)

Жаңа SQLite немесе жинақтарды толығымен ауыстыру: `scripts/import_hadith_from_open_sources.py` — [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) `eng` / `ara` / `rus` минималды JSON.

```bash
.venv/bin/python scripts/import_hadith_from_open_sources.py --db global_clean.db \
  --books bukhari,muslim --replace --i-understand
```

**Қауіп:** `--replace` таңдалған `source` бойынша бар `hadith` жолдарын жояды. Алдымен көшірме сақтаңыз.

Кейін: `fill_hadith_text_fawaz.py` қажет емес (импортта en/ru қойылды); `text_kk` — `translate_hadith_kk_batch.py`. Индекс: `create_hadith_fts.py` (қолданбаңызда бар болса).

---

## 3а. Орыс және ағылшынша (CDN, «сахих» жинақтар)

| Тіл | Бағана | Скрипт |
|-----|--------|--------|
| Ағылшынша (Sahih International стилі) | `text_en` | `.venv/bin/python scripts/fill_hadith_text_fawaz.py --db global_clean.db --target en` |
| Орысша | `text_ru` | `--target ru` немесе ескі `fill_hadith_text_ru_fawaz.py` (сол скриптті шақырады) |
| Екеуі қатар | | `bash scripts/run_hadith_fawaz_en_ru.sh` |

Дереккөз: [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) — әр хадис жеке JSON (`eng-bukhari`, `rus-muslim`, …). Әбу Дәуд үшін API соңы 5274; дерекқорда одан аса жол болса, орыс/ағылшынша бос қалады.

Экспортта `textRu` / `textEn` JSON-ға кіреді (`hadith_corpus_sync.py export`), қолданба офлайн көрсете алады.

---

## 4. Қазақша аударма (`text_kk`) қайдан келеді

| Қадам | Файл / команда |
|--------|----------------|
| Сахих Бұхари+Муслим батч аударма | `translate_hadith_kk_batch.py`, орамы: `bash scripts/run_sahih_hadith_kk.sh` |
| Жоғары сапа режимі (2 өтім API) | `translate_hadith_kk_batch.py --verify-each --workers 1 …` — әр жолда аудармадан кейін арабпен салыстырып JSON түзету; `data/hadith_kk_glossary.md` промптқа автоматты қосылады (`--no-glossary` өшіреді) |
| Параллель Gemini | `translate_hadith_kk_batch.py --workers 4 ...` (`spawn` пул; DB жазу — негізгі процесс) |
| Қауіпсіз жалғастыру | `bash scripts/run_hadith_kk_safe_resume.sh` |
| Статистика (қанша қалды) | `.venv/bin/python scripts/hadith_corpus_sync.py stats --db ./global_clean.db` |
| Сапа аудиті (ағылшынша/мета сіңім) | `.venv/bin/python scripts/audit_hadith_kk_quality.py --db global_clean.db --write-ids data/hadith_kk_repair_ids.txt` |
| Күдікті жолдарды қайта аудару | `translate_hadith_kk_batch.py --bukhari-muslim --force --ids-file data/hadith_kk_repair_ids.txt --sleep 6` (`GEMINI_API_KEY` қажет) |
| Мобильді бандл экспорты | `mobile`-та: `npm run export:hadith-json` — **толық** сахих корпус (`--only-with-kk` емес). Жеңіл JSON үшін: `npm run export:hadith-json:kk-only`. |
| Модель | `.env` → `GEMINI_API_KEY`; модель тізімі `AI_MODEL_CANDIDATES` (`translate_hadith_kk_batch.py` докстринг). |

Аударма **діни мәтін**: автоматты шығыс **редакциялаудан** өтуі керек; өндірісте сапа шолуы ұсынылады. Кейбір жолдарда модель ағылшынша «ойлау» мәтінін қалдыруы мүмкін — `audit_hadith_kk_quality.py` латын үлесі мен үлгілер бойынша күдіктілерді табады.

---

## 5. Мобильді бандл үлгілері

| Файл | Мазмұны |
|------|---------|
| `mobile/assets/bundled/hadith-sahih-seed.json` | Шағын үлгі; ішінде `provenance` блогы (нұсқа, ескерту). |
| `mobile/assets/bundled/hadith-from-db.json` | DB экспортынан (`hadith_corpus_sync.py export`) — толық/жартылай корпус. |

---

## 6. Іздеу индексі (SQLite)

`hadith_fts` (FTS5) — `create_hadith_fts.py`. `text_kk` массово жаңартылғаннан кейін индексті **қайта құру** керек болуы мүмкін.

---

## 7. Қысқа ескерту (құқық / басылым)

Репозиторий **исламдық риуаят дәстүрінің** ашық білімін қайта пайдаланады; нақты баспа/веб-сайт лицензиясы мен редакциялық саясат **жоба иесінің** құжаттауы тиіс. Бұл файл тек **техникалық сәйкестікті** (кітап атауы = `source` жолы, бағаналар, синк жолдары) бекітеді.

---

## 8. Қатысты код жолдары

- `handlers/hadith.py` — `STRICT_SAHIH_SOURCES`, `SAHIH_SOURCE_META`, `OTHER_SOURCE_META`
- `scripts/hadith_corpus_sync.py` — `SOURCE_SLUG`, `SAHIH_SOURCES`, экспорт/импорт
- `db/hadith_repo.py` — мәтін бағанасын таңдау
- `translate_hadith_kk_batch.py` — аударма батчысы

Толық платформа брифі: `docs/PLATFORM_GPT_HANDOFF.md` (хадис KK батч/resume: **§18**).

---

## 9. Сахих мағыналарын зерттеу, толықтыру және редакциялау

Автоматты аударма **бірінші нұсқа** болып табылады. Сахих Бұхари мен Муслимдегі қазақша мағыналарды **нақтылау** үшін жеке **зерттеу + редакция** қажет: тек техникалық скрипт жеткіліксіз.

### 9.1 Қай кезеңде не істеледі

| Кезең | Мақсаты | Негізгі құрал |
|-------|---------|----------------|
| **Қамту** | Бос `text_kk` толтыру | `run_sahih_hadith_kk.sh`, `run_hadith_kk_safe_resume.sh`, `translate_hadith_kk_batch.py` |
| **Сапа скринингі** | Модель «ойлау» мәтіні, ағылшынша сіңім, артық латын | `scripts/audit_hadith_kk_quality.py` |
| **Авто-жөндеу** | Күдікті id бойынша қайта генерация | `--write-ids` → `--force --ids-file` (`translate_hadith_kk_batch.py` докстрингіне қараңыз) |
| **Шолу батчы** | Алдын ала толтырылған жолдарды шектеулі қайта өңдеу | `translate_hadith_kk_batch.py --review-limit …` |
| **Қолмен түзету** | Терминология, стиль, мағына дәлдігі | DB редакторы немесе JSON экспорт/импорт (`hadith_corpus_sync.py`) |
| **Іздеу индексі** | `text_kk` өзгерісінен кейін | `create_hadith_fts.py` (қажет болса) |

Статистика (қанша жол толтырылған) репо DB снапшотына байланысты: `python scripts/hadith_corpus_sync.py stats --db ./global_clean.db` немесе `docs/PLATFORM_GPT_HANDOFF.md` **§18** мысалындағы `get_content_stats` жолы.

### 9.2 Мазмұндық принциптер (редакциялық)

- **Түпнұсқа:** `text_ar` — сәйкестікті әрқашан одан тексеру; аудармада риуаят мағынасын **бұрмай**, қосымша фиқһ үкім енгізбеу (қолданбада жалпы disclaimer бар: `docs/RAQAT_PLATFORM.md`).
- **Терминология:** бір жинақ ішінде бірдей ұғымдар үшін тұрақты қазақша терминдер — **`data/hadith_kk_glossary.md`** (бастапқы кесте, редакциямен толықтырылады).
- **Батчтар бойынша шолу:** дерекқор `id` ауқымдары — **`data/hadith_kk_editorial_batches.md`** (Бұхари/Муслим мысал ауқымдары, SQL, чеклист).
- **Салыстырулық оқу:** академиялық ағылшынша/орысша аудармалар мен шарһтар тек **түсінуге** көмектеседі; лицензиясы рұқсат еткен басылымды нақты атамай, мәтінді көшірмеу керек — өз қазақша формулировкаңыз.
- **Сахих іріктеу:** бот/UI «сахих» режимі тек `Sahih al-Bukhari` және `Sahih Muslim` (`STRICT_SAHIH_SOURCES`) — редакциялық басымдықты осы екі көзге қою орынды.

### 9.3 Сапаны техникалық тексеру реттемесі

1. **Күдіктілер тізімі:**  
   `.venv/bin/python scripts/audit_hadith_kk_quality.py --db global_clean.db --write-ids data/hadith_kk_repair_ids.txt`
2. **Шолу:** шығарылған id және мәтін үзінділері — қолмен қарау (мағына дұрыс па, тек формула қате па).
3. **Қайта аудару (авто):**  
   `translate_hadith_kk_batch.py --bukhari-muslim --force --ids-file data/hadith_kk_repair_ids.txt --sleep 6` (`GEMINI_API_KEY`).
4. **Немесе қолмен:** `hadith_corpus_sync.py export` → JSON өңдеу → `import` (құжаттағы нұсқаға сәйкес); немесе SQLite-да тікелей `UPDATE hadith SET text_kk = … WHERE id = …` + `updated_at` жаңарту (инкременттік синхрон үшін).

### 9.4 Ұйымдастыру ұсынысы

- **Топтау:** Бұхари/Муслим кітап главалары бойынша кезек (көлемді жұмысты бөлу).
- **Екі кезеңді рецензия:** бірінші оқу — мағына/термин; екінші — тек тіл және латын/ағылшынша қалдықтары.
- **Нұсқа белгілеу:** мобильді бандл `provenance` немесе ішкі журналда «редакция нұсқасы» күнін сақтау (қажет болса өнім құжаттамасында).

Осы бөлім **зерттеу-редакция жұмысын** техникалық репо контекстіне байланыстырады; исламдық мазмұнды растау **адами білім** және діни сенімділік талаптарына бағынады.
