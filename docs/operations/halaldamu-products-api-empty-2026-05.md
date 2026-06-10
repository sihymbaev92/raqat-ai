# halaldamu.kz — products API бос (2026-05-19)

**Мақсаты:** halaldamu.kz техникалық бөліміне жіберу — `products` endpoint дерек қайтармайды; RAHAT OMIR мобильді штрихкод/өнім іздеуі бос.

---

## Тексеру нәтижесі

| Endpoint | HTTP | Нәтиже |
|----------|------|--------|
| `GET /wp-json/halal-bot/v1/companies` | 200 | ~3757 ұйым, ~4.5 МБ JSON |
| `GET /wp-json/halal-bot/v1/products?per_page=5` | 200 | `success: true`, **`items: []`**, `total: 0` |
| `GET /wp-json/halal-bot/v1/products?search=сүт&per_page=5` | 200 | **`items: []`**, `total: 0` |
| `GET https://api.rahatomir.com/api/v1/halal-damu/status` | 200 | прокси қосулы, кэш жұмыс істейді |

Тексеру күні: **2026-05-19** (VPS + жергілікті curl).

### Қайта тексеру — сайттан «көшіру» мүмкіндігі (2026-05-30)

`python scripts/probe_halaldamu_products_web.py`:

| Дереккөз | Нәтиже |
|----------|--------|
| `GET …/products` | `total: 0`, `items: []` |
| `GET …/additives` | `total: 0`, `items: []` |
| 500 ұйым (`companies`, 5×100) | барлығында `products: []` |
| `/products/`, `/catalog/` HTML | **404** |
| Басты бет HTML | `barcode`, `halal-bot/v1/products`, өнім JSON жоқ |
| `companies/{id}` detail | `products` жоқ / бос |

**Қорытынды:** ашық сайтта да, ашық API-да да **өнім каталогы жарияланбаған** — скрейппен толықтыруға көзделетін HTML/JSON жоқ. «Сайттан көшіріңдер» дегенде, қазір көрінетін бөлім — тек **ұйымдар** (~3765); штрихкод/өнім деректері серверде бос кестеде тұрған сияқты.

**RAQAT уақытша шешім:** `data/halal_products_seed_kz.csv` (~96 GTIN) + `npm run halal:seed` — [`halal-products-seed-kz.md`](./halal-products-seed-kz.md). Жіберуге дайын хат: [`halaldamu-letter-send-ready-2026-05-30-kk.md`](./halaldamu-letter-send-ready-2026-05-30-kk.md).

### Мониторинг скрипті (cron/CI)

```bash
python scripts/check_halaldamu_products_api.py --fail-if-empty --json-out data/halaldamu-products-monitor.json
```

- Exit `0` — products `total > 0` немесе `--fail-if-empty` жоқ
- Exit `1` — products әлі бос (`--fail-if-empty`)
- Exit `2` — желілік қате

Мобильді: `HalalProductsApiBanner` + `probeHalalProductsApi()` (6 сағат кэш).

Wireframe: `docs/design/halaldamu-p1-wireframe.md`.

---

## RAHAT OMIR қолданбасына әсері

- **Ұйымдар каталогы** — жұмыс істейді (companies API толы).
- **Штрихкод / өнім атауы бойынша іздеу** — нәтиже **әрқашан бос** (products API дерек жоқ).
- **Камера + AI** — штрихкод/атау оқылғаннан кейін де products API-ға түседі; өнім табылмаса — тек ұйымдар fallback.

---

## Жіберуге дайын хат (қысқа)

**Тақырып:** halal-bot/v1/products API — деректер бос, интеграция сұрауы

Құрметті halaldamu.kz командасы!

Біз **RAHAT OMIR** (Қазақстан исламдық мобильді қосымша) жобасында сіздердің ашық JSON API-ны ресми дереккөз ретінде қолданамыз.

**Companies** API (`/wp-json/halal-bot/v1/companies`) дұрыс жұмыс істейді (~3757 жазба). Ал **products** API:

```
GET https://halaldamu.kz/wp-json/halal-bot/v1/products
GET https://halaldamu.kz/wp-json/halal-bot/v1/products?search=...
```

барлық сұраулarda **`items: []`**, `total: 0` қайтарады (2026-05-19 тексеру).

Сондықтан қолданбадағы **штрихкод сканерлеу** және **өнім атауымен іздеу** функциялары нәтиже бермейді — бұл біздің клиент қатесі емес, реестрде өнім деректері API арқылы жетімді емес.

**Сұраймыз:**

1. `products` кестесі/API жоспарланған ба? Қашан толықтырылады?
2. Штрихкод (`barcode`) өрісі бойынша ресми документация бар ма?
3. Сыртқы серіктестер (мысалы RAHAT OMIR) үшін техникалық байланыс (email/Telegram) кімде?
4. Rate limit / кэш TTL ұсыныстары (companies bulk ~4 МБ) — [halaldamu-official-partnership-letter-kk.md](./halaldamu-official-partnership-letter-kk.md) бойынша ынтымақтастық.

Біз деректер пайда болғанша **тек companies** көрсетеміз; әрқашан halaldamu.kz ресми сайтына сілтейміз.

Құрметпен,  
**[Аты-жөні]**  
RAHAT OMIR / Imam AI  
Email: **[email]**  
Телефон: **[telefon]**  
Сайт: https://rahatomir.com

---

## Қосымша

Толық ынтымақтастық хаты: [halaldamu-official-partnership-letter-kk.md](./halaldamu-official-partnership-letter-kk.md)

Прокси статус: `GET https://api.rahatomir.com/api/v1/halal-damu/status`
