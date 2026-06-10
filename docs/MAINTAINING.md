# Құжаттаманы жаңарту ережелері

`docs/` құрылымы 2026-05 бөлінді. Жаңа фактілер **монолитке енгізілмейді**.

---

## Қайда не жазу

| Түр | Қайда |
|-----|--------|
| Мобильді релиз / сессия | `mobile/changelog/YYYY-MM-DD.md` (**жаңа файл**) |
| Platform API өзгерісі | `platform_api/*.md` немесе `architecture/` |
| Ops / cutover | `operations/` |
| Өнім жоспары | `roadmap/` |
| Өнім шешімі | `product/` |

---

## Жаңартуға болмайды

- `archive/PLATFORM_GPT_HANDOFF_2026-05.md` — тарихи снапшот
- Барлық `changelog/*.md` — тек қате түзету

---

## Жаңа changelog қадамы

1. `docs/mobile/changelog/2026-05-17.md` (мысал) жасау
2. `mobile/README.md` кестесіне қосу
3. Қажет болса `docs/README.md` «соңғы сессия» жолын жаңарту

---

## Көшіру скрипті

Архивтен қайта бөлу (қажет сирек):

```bash
python scripts/split_handoff_docs.py 2   # changelog + roadmap
python scripts/split_handoff_docs.py 3   # architecture + platform_api + handoff
python scripts/polish_doc_banners.py      # бөлінген файлдардағы баннерді біркелкілеу
```

§ нөмірін іздеу орнына: [handoff/section-map.md](handoff/section-map.md)

---

## Сілтемелер

- `docs/PLATFORM_GPT_HANDOFF.md` — GPT кіру нүктесі (снапшот + сілтемелер); монолит емес, жаңартылады
- §23 сияқты нөмірлер орнына **файл жолы**: `architecture/data-and-auth.md`
- GPT пакет: [handoff/gpt-sre-summary.md](handoff/gpt-sre-summary.md)

[← docs/README.md](README.md)
