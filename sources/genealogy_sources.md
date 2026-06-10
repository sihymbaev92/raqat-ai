# Шежіре дереккөздері (Genealogy Sources)

**Sprint:** GENEALOGY-P0 · **Каталог:** `db/shezhire_catalog_data.py` + `scripts/build_shezhire_bundled.py` → `genealogy-p0.json` (v4, ~191 node).  
**Мақсаты:** әр ру/тribe `genealogy_source_refs.source_key` арқылы осы тізімде сілтеме жасайды.  
Келешек **AI Grounding** фазasında LLM тек осы кілттермен расталған деректерді қайтара алады.

---

## Дереккөз кілттері

| `source_key` | Автор / ұйым | Шығарма / зерттеу | AI grounding |
|--------------|--------------|-------------------|--------------|
| `mashhur_jusip_shezhire` | Мәшһүр Жүсіп Көпейұлы (1858–1931) | Шежіре жинақтары, ру-тайпа иерархиясы | **P0 — негізгі** |
| `shakarim_shezhire` | Шәкәрім Құдайбердіұлы (1858–1931) | «Шежіре-тарих», ру атаулары мен байланыстары | **P0 — негізгі** |
| `nas_ethnography_kz` | ҚР Ұлттық Ғылым академиясы (этнография) | Қазақ ру-тайпа этнографиялық зерттеулері | **P0 — верификация** |
| `wikipedia_kk_zhuz` | Wikipedia (kk) | Үл жүз / Орта жүз / Кіші жүз шолу | **P2 — тек UI шолу, citation емес** |
| `genealogy_public_figure_bio` | Жариялаған биография / сұхбат | Аtaқ tylygalar ru baylanysy | **P1 — person node** |

---

## `mashhur_jusip_shezhire`

- **Түрі:** классикалық қазақ шежіресі  
- **Мазмұны:** ру атаулары, тармақ иерархиясы, кейбір рулардың шығу тегі  
- **RAQAT қолдану:** level 2–3 рулардың атаулары мен parent-child байланысы  
- **Ескерту:** нақты бет/тарау нөмірі `genealogy_source_refs.page_or_section` өрісінде сақталады  

---

## `shakarim_shezhire`

- **Түрі:** тарихи-шежірелік жинақ  
- **Мазмұны:** ру атауларының баламалы жазылулары, тармақтар  
- **RAQAT қолдану:** `name_kk_alt`, cross-check level 3 рулар  

---

## `nas_ethnography_kz`

- **Түрі:** академиялық этнография  
- **Мазмұны:** ҚР НА этнографиялық зерттеулер — жүз/ру классификациясы  
- **RAQAT қолдану:** жүз (level 1) деңгейін растау, спорлы руларды «review» статусына қою  

---

## `wikipedia_kk_zhuz`

- **Түрі:** ашық энциклопедия (kk)  
- **Мазмұны:** жалпы шолу  
- **RAQAT қолдану:** **AI жауапқа енгізілмейді** — тек мобиль UI intro мәтіні  
- **Себебі:** академиялық citation емес; галлюцинация risk  

---

## Жаңа дереккөз қосу ережесі

1. Осы файлға `source_key` + толық citation қосу  
2. PR-да genealogy maintainer review  
3. `genealogy_source_refs` INSERT — тек жарияланған (`is_published=1`) руларға  
4. AI grounding whitelist: тек `P0`/`P1` кілттер  

[← genealogy_schema.md](../docs/genealogy_schema.md)
