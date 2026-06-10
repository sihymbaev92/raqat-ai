# Telegram бот

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 3. Telegram бот (`handlers/`)

| Модуль | Функция |
|--------|---------|
| `start.py` | /start, мәзір |
| `quran.py` | Сүре, мәтін, аудио, іздеу, тәжвид, хатм |
| `hadith.py` | Хадис, іздеу |
| `prayer.py`, `qibla.py`, `tasbih.py` | Намаз, құбыла, тәсбих |
| `halal.py` | Сурет → `analyze_halal_photo` (API немесе тікелей Gemini) |
| `voice.py` | Дауыс, `transcribe_voice_command`, `ask_genai` |
| `ai_chat.py` | RAQAT AI чат, `ask_genai`; жауаптан кейін **`append_telegram_ai_turn`** → `platform_ai_chat_messages` |
| `services/tts_reply.py` | `synthesize_speech` |
| `language.py`, `translation.py`, `onboarding.py` | Тіл, нұсқаулық |
| `feedback.py`, `admin.py` | Кері байланыс, әкімші |
| `services/genai_service.py` | Орталық API ↔ Gemini |

---
