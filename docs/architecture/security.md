# Қауіпсіздік

> Ағымдағы құжат. Архив снапшоты: [archive/PLATFORM_GPT_HANDOFF_2026-05.md](../archive/PLATFORM_GPT_HANDOFF_2026-05.md). § картасы: [section-map.md](../handoff/section-map.md).

---

## 10. Қауіпсіздік

- `.env` репоға **емес**.  
- AI: **`X-Raqat-Ai-Secret`** **немесе** JWT (**`RAQAT_JWT_SECRET`**, scope **`ai`**).  
- Оқу-only: опция **`X-Raqat-Content-Secret`** **немесе** JWT scope **`content`**.  
- **Telegram → JWT шығару:** **`RAQAT_BOT_LINK_SECRET`** тек серверде; `X-Raqat-Bot-Link-Secret` клиентке таратпау.  
- Bootstrap пароль: өндірісте **`RAQAT_AUTH_PASSWORD_BCRYPT`**; plaintext тек dev.  
- Діни мәтін + AI: фиқһтық үкім емес — disclaimer (`RAQAT_PLATFORM.md`).

Cutover / rollback / нұсқа жауаптар (A·sync·pool·FTS): `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §15.

---
