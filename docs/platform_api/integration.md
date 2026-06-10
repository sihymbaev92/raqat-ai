# Bot + Mobile = бір платформа

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 19. Integration Completed — Bot + Mobile = One Platform (2026-04-16)

Бұл бөлімде экожүйені бір орталыққа біріктіру статусы бекітіледі.

### 19.1 Негізгі принцип

RAQAT-та бот пен мобильді клиенттің барлық негізгі дерегі мен AI логикасы бір көзден келуі керек:

- **Single source of truth:** `platform_api`
- Клиенттер: Telegram bot + Mobile app + Web
- Бір identity кеңістігі: `platform_user_id` / JWT

### 19.2 Іске асқан өзгерістер

Код деңгейінде бір орталық режим қосылды:

- `config/settings.py`
  - `RAQAT_BOT_API_ONLY` дефолты -> `1`
  - жаңа `RAQAT_SINGLE_SOURCE_MODE` дефолты -> `1`
- `services/genai_service.py`
  - AI/TTS/voice/image үшін боттағы тікелей Gemini fallback single-source режимде өшірілді
  - жол: Bot -> Platform API -> Gemini/provider
- `.env.example`
  - `RAQAT_SINGLE_SOURCE_MODE=1` құжаты қосылды

### 19.3 Smoke валидация (өткен)

API-only bot content smoke нәтижесі:

- `GET /ready` -> 200
- `GET /api/v1/hadith/random` -> 200
- `GET /api/v1/hadith/search` -> 200
- `GET /api/v1/quran/search` -> 200
- `GET /api/v1/quran/{surah}` -> 200

### 19.4 Known operational risk

- Telegram Bot API жағына DNS тұрақсыздығы байқалған:
  - `api.telegram.org` resolution intermittent failure
- Бұл архитектура қатесі емес, infra/network reliability мәселесі.

---
