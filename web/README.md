# RAQAT веб (статикалық MVP)

## Жергілікті қарау

Репозиторий түбінен:

```bash
cd web && python3 -m http.server 8080
```

Содан кейін браузерде: `http://localhost:8080`

## Орналасу

- Негізгі бет: `index.html`
- Стиль: `styles.css`
- Бот сілтемесі: `https://t.me/my_islamic_ai_bot` (қолданбадағы `TelegramInfoScreen` сияқты)

Production: nginx, Cloudflare Pages, GitHub Pages немесе кез келген статикалық хостингке `web/` қалтасын жүктеңіз.
