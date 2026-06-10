# Mobile Production Data Coverage

Бұл файл release алдында мешіт және halal product дерегі қай деңгейде екенін тез тексеруге арналған.

## Coverage Snapshot

```bash
python scripts/print_mobile_data_coverage.py
```

Көрсетеді:
- bundled 2GIS мешіт жалпы саны;
- `mosqueDetailsEnrichment.ts` ішіндегі `verified / partial / map_only` coverage;
- bundled halal seed product саны;
- official HalalDamu products API monitor командасы.

## HalalDamu Official API

```bash
python scripts/check_halaldamu_products_api.py --json-out data/halaldamu-products-monitor.json
```

Ереже:
- `products_api_has_data=true` болса, official product search толық қосуға болады;
- `false` болса, app `official_product` орнына RAQAT seed және certified producer fallback көрсетеді;
- Play release notes-та бұл “reference/fallback” екенін жасырмау керек.

## Mosque Data

Мешіт карточкасының confidence мағынасы:
- `verified`: имам/байланыс/photo сияқты дерек ресми/сенімді source-пен расталған;
- `partial`: негізгі сипаттама немесе source бар, бірақ imam/phone/photo толық емес;
- `map_only`: картадағы атау/мекенжай/маршрут қана, қосымша ресми ақпарат жоқ.

2GIS каталогын жаңарту:

```bash
DGIS_API_KEY=... python scripts/sync_2gis_mosques_kz.py
```

Sync script мүмкін болса `contact_groups`, `schedule`, `full_address_name` өрістерін де сақтайды. Бұл деректер app-та fallback detail ретінде автомат көрінеді, бірақ имам аты тек ресми source-пен расталғанда ғана `mosqueDetailsEnrichment.ts` ішіне қолмен қосылады.

Тереңдету queue:

```bash
python scripts/build_mosque_enrichment_queue.py --limit 200
python scripts/build_mosque_enrichment_queue.py --region Алматы --out data/mosque_enrichment_queue_almaty.csv
```

Queue CSV әр мешітке 2GIS, Google, Yandex және muftyat.kz іздеу сілтемелерін дайындайды. Растауға жарайтын source түрлері:
- ресми мешіт/ҚМДБ/muftyat.kz парағы;
- жергілікті әкімдік/сенімді жаңалық беті;
- картадағы phone/site дерегі, бірақ imam аты үшін жеке official confirmation керек.

Release gate:
- ірі қала/ең жиі көрінетін мешіттер кемі `partial` немесе explicit `map_only`;
- `verifiedAt` және `sources` бос болмауы керек;
- толық imam/phone/photo дерегі ресми source табылғанда ғана қосылады.

