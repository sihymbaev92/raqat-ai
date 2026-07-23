# RAQAT — KZ halal өнім seed (уақытша)

halaldamu `products` API бос болғанда штрихкод/атау іздеуге **қолмен + Open Food Facts** GTIN каталогы.

**Қазіргі бандл:** ~**3760** өнім (`mobile/assets/bundled/halal-products-seed-kz.json`, version 1).

OFF скрипті: Қазақстан + РФ/Өзбекстан/Қырғызстан/Түркия/Әзербайжан және кеңейтілген бренд тізімі (`--limit 3000` дейін жаңа жол).

## Файлдар

| Файл | Мақсаты |
|------|---------|
| `data/halal_products_seed_kz.csv` | Қолмен өңдеу (дереккөз) |
| `scripts/expand_halal_products_seed_from_off.py` | Open Food Facts (KZ + бренд) → CSV |
| `scripts/enrich_halal_products_seed.py` | company_id / OFF GTIN толықтыру |
| `scripts/build_halal_products_seed_json.py` | CSV → JSON, EAN-13 checksum тексеру |
| `mobile/assets/bundled/halal-products-seed-kz.json` | Қосымша бандлы |
| `mobile/src/services/halalProductsSeedKz.ts` | Іздеу / штрихкод lookup |

## Жаңарту

```bash
# OFF-тан жаңа GTIN (лимит ~1000)
npm run halal:seed:off --prefix mobile
# немесе:
python scripts/expand_halal_products_seed_from_off.py --limit 1000

# company_id (halaldamu) + нақты GTIN (Open Food Facts, off_query бағанасы)
python scripts/enrich_halal_products_seed.py

# тек JSON қайта құру
python scripts/build_halal_products_seed_json.py
```

CSV бағандары: `gtin`, `title_kk`, `brand`, `ingredients`, `company_id`, `certificate_status`, `notes`.

- `company_id` — halaldamu `companies` id (бар болса карточкаға өту).
- `certificate_status`: әдепкі `reference` («Анықтама ғана»); `company_id` барда скрипт `active` қояды.
- OFF жолдарының `notes` өрісінде `open_food_facts` белгісі болады.

## Клиент реті

1. halaldamu `products` API  
2. RAQAT seed (штрихкод / атау)  
3. Сертификатты өндірушілер fallback  

API толыққанда seed автоматты артта қалады.

## Ескерту

Seed GTIN-дері **нақты дүкен штрихкодымен сәйкес келуі мүмкін емес** — нақты кодтарды CSV-ге қосып, build қайта іске қосыңыз. Бұл ресми halaldamu сертификаты емес.
