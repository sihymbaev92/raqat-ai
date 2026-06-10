# halaldamu.kz — жіберуге дайын хат (2026-05-30)

**Тақырып (email):** RAHAT OMIR — halal-bot products API деректері және ынтымақтастық

**Кімге:** halaldamu.kz техникалық бөлім / ҚМДБ  
**Кімнен:** RAHAT OMIR командасы  

---

Құрметті halaldamu.kz командасы!

Біз **RAHAT OMIR** (https://rahatomir.com) — Қазақстан исламдық мобильді қосымшасын әзірлеп жатырмыз. Сіздердің ашық WordPress JSON API (`/wp-json/halal-bot/v1/…`) **оқу режимінде** қолданылады; пайдаланушыға әрқашан **halaldamu.kz** ресми сайтына сілтеме беріледі.

## Ағымдағы күй (2026-05-30)

| Endpoint | Нәтиже |
|----------|--------|
| `GET …/companies` | ~3765 ұйым, HTTP 200 |
| `GET …/products` | **`items: []`**, `total: 0` |
| `GET …/products?barcode=…` | бос |
| `GET …/additives` | бос |
| Ашық сайт `/products/` | 404 (HTML каталог жоқ) |

Сондықтан қолданбадағы **штрихкод сканерлеу** ресми өнім реестрінен нәтиже алмайды — бұл клиент қатесі емес.

Біз уақытша **қолмен GTIN анықтама** (~96 жазба) қолданамыз; деректер сіздердің `products` API толыққанда автоматты ауыстырылады.

## Сұраулар

1. **`products` API** қашан толықтырылады? Штрихкод (`barcode`) және атау бойынша іздеу жоспары бар ма?  
2. Сыртқы серіктестерге **CSV/JSON экспорт** немесе API кілт мүмкін бе? («Сайттан көшіріңдер» деп айтылған — бірақ ашық HTML-де өнім каталогы жоқ.)  
3. **Rate limit** және каталог (~4 МБ `companies`) үшін ұсынылатын **кэш TTL**.  
4. Техникалық байланыс: email / Telegram кімде?  
5. RAHAT-ты ресми дерек серіктесі ретінде тіркеу және логотип алмасу мүмкін бе?

## Біздің техникалық жағы

| Параметр | Мән |
|----------|-----|
| User-Agent (прокси) | `Raqat-Platform/1.0 (Halal Damu proxy; +https://rahatomir.com)` |
| Шлюз | `GET https://api.rahatomir.com/api/v1/halal-damu/halal-bot/v1/…` |
| Мониторинг | `python scripts/check_halaldamu_products_api.py --fail-if-empty` |

Құрметпен,  
**[Аты-жөні]**  
**[Лауазым]**  
RAHAT OMIR  
Email: **[email]**  
Телефон: **[телефон]**  
Сайт: https://rahatomir.com  

---

*Қосымша құжат: `docs/operations/halaldamu-products-api-empty-2026-05.md`, `docs/operations/halal-products-seed-kz.md`*
