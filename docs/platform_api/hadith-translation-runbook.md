# Hadith KK translation runbook

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 18. Hadith KK Translation — Resume Runbook (2026-04-16)

Сахих хадистерді (Bukhari + Muslim) аударуды тоқтаған жерінен қауіпсіз жалғастыру үшін осы бөлім бекітілді.

### 18.1 Ағымдағы статус (операциялық)

- DB: `global_clean.db`
- Hadith total: `33,738`
- `text_kk` filled: `6,581` (~`19.5%`)
- Missing: `27,157`

Ескерту: алдыңғы тоқтау себептері:

- `403 PERMISSION_DENIED` (project/model access)
- `404 NOT_FOUND` (ескі модель `gemini-1.5-flash`)
- кейде `503 UNAVAILABLE` (model high demand, retry қажет)

### 18.2 Safe resume скрипті

Жаңа скрипт:

- `scripts/run_hadith_kk_safe_resume.sh`

Не істейді:

- `.env` жүктейді
- `AI_MODEL_CANDIDATES` дефолтын modern модельдерге қояды:
  - `gemini-2.5-flash,gemini-2.5-flash-lite`
- `translate_hadith_kk_batch.py`-ды conservative retry/sleep параметрлерімен іске қосады
- `FROM_ID` арқылы resume қолдайды
- backup жасайды

### 18.3 Іске қосу командалары

Қысқа smoke:

```bash
LIMIT=20 SLEEP_SEC=4 MAX_ERRORS=5 bash scripts/run_hadith_kk_safe_resume.sh
```

Ұзақ run (resume):

```bash
FROM_ID=107803 LIMIT=0 SLEEP_SEC=4 MAX_ERRORS=20 bash scripts/run_hadith_kk_safe_resume.sh
```

Background режим:

```bash
nohup bash scripts/run_hadith_kk_safe_resume.sh > hadith_kk.log 2>&1 &
```

### 18.4 Прогресс тексеру

```bash
python3 -c "from platform_api.db_reader import get_content_stats; import json; print(json.dumps(get_content_stats(), ensure_ascii=False, indent=2))"
```

### 18.5 Міндетті ескертулер (SRE)

- `503 UNAVAILABLE` — уақытша, retry арқылы жалғасады.
- `403 PERMISSION_DENIED` тұрақты болса, бұл код қатесі емес; Gemini project access/quotas түзету керек.
- Әр run алдында backup жасалғанына көз жеткізу керек.
- FTS қолданылса, толықтырудан кейін: `python create_hadith_fts.py`.

---
