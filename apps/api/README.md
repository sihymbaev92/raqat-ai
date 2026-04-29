# RAQAT Platform API (`apps/api`)

**Бұл қалта — blueprint карта.** Негізгі backend коды **осы жерде емес**, [`../../platform_api/`](../../platform_api/) қалтасында: `main.py`, `app/`, AI прокси, auth.

## Іске қосу

| Жол | Команда |
|-----|--------|
| **Осы картадан (қысқа)** | PowerShell: [`dev.ps1`](./dev.ps1) — `.\dev.ps1` немесе `.\dev.ps1 -Dev` (Redis міндеттемеу) |
| | bash/WSL: [`dev.sh`](./dev.sh) — `bash dev.sh` |
| Түбір скрипттері | `bash ../../scripts/run_platform_api.sh` немесе `powershell -File ../../scripts/run_platform_api.ps1` |
| Тікелей | `cd ../../platform_api && uvicorn main:app --reload --port 8787` ( `.venv` дайын болуы керек) |

Толығырақ: [`../../docs/DEV_LOCAL_CHECKLIST.md`](../../docs/DEV_LOCAL_CHECKLIST.md), [`../../ECOSYSTEM.md`](../../ECOSYSTEM.md).

**Келешек:** физикалық `apps/api` ↔ `platform_api` бірыңғайлау (қалта атауын ауыстыру) тек жеке рефакторинг жоспарымен; қазіргі шындық — жоғарыдағы `platform_api/` жолы.
