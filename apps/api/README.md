# RAQAT Platform API (`apps/api`)

Blueprint бойынша негізгі backend осы қалтада тұрады.

**Қазіргі код:** [`../../platform_api/`](../../platform_api/) — `main.py`, `app/` модульдері, AI прокси, auth.

Іске қосу: `bash ../../scripts/run_platform_api.sh` немесе `cd ../../platform_api && uvicorn main:app --reload --port 8787`.

Физикалық `apps/api` → `platform_api` көшірмесі келесі рефакторингте (import пен CI бірден жаңартылады).
