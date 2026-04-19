# RAQAT Telegram Bot (`apps/bot`)

Blueprint бойынша бот — **тек кіру нүктесі**; identity, AI, контент truth — Platform API арқылы.

## Қазіргі орналасу

Entrypoint және модульдер әлі репо **түбінде**:

| Мазмұн | Жол |
|--------|-----|
| Entry | `../../bot_main.py` |
| Handlers | `../../handlers/` |
| Конфиг | `../../config/` |
| Сервистер | `../../services/` |
| DB | `../../db/` |

## Іске қосу

Репозиторий түбінен:

```bash
python bot_main.py
```

Немесе: `bash ../../scripts/dev_restart_platform.sh` (API + опциямен бот).

Келесі рефакторинг: `apps/bot/` ішіне `pyproject.toml`, `src/bot/` көшіру — импорттарды бір уақытта жаңарту керек.
