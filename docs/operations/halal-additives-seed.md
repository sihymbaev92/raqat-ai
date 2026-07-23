# RAQAT — E-код / қоспалар seed (уақытша)

halaldamu `additives` API бос болғанда E-код іздеуге **Open Food Facts + қолмен үкім қабаты**.

**Қазіргі бандл:** ~**663** жазба (`mobile/assets/bundled/halal-additives-seed.json`, v2).

- OFF E-кодтар + көптілді алиастар
- Кеңейтілген HARAM/MUSHKIL қабаты (E120, E441, E542, E904, E471 тобы, …)
- Атаулы құрам: желатин, реннет, шошқа, спирт, эмульгатор, …

## Жаңарту

```bash
npm run halal:additives:build --prefix mobile
# немесе:
python scripts/build_halal_additives_seed.py
```

## Тәуекел белгілері

| risk | Мағынасы |
|------|----------|
| `HARAM` | Харам болуы ықтимал (мыс. E120 кармин) |
| `MUSHKIL` | Күдікті — тегі/сертификат тексерілсін (E471, желатин, …) |
| `REFERENCE` | Жалпы каталог — ресми пәтуа емес |

## Ескерту

Бұл **ресми пәтуа емес**. Соңғы шешім — құрам, өндіруші және Halal Damu / Fatua дереккөздері.
