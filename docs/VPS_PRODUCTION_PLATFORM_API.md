# Platform API: сыртқа шығару (телефон 4G / өндіріс)

Мобильді қолданба **`https://api.домен.kz`** сияқты **жалпыға ашық HTTPS** мекенжайын қажет етеді. `http://192.168.x.x:8787` тек сол Wi‑Fi ішінде жұмыс істейді.

---

## 1) Жылдам сынақ: туннель (роутер портын ашпай)

Компьютерде `platform_api` іске қосылған болсын (`127.0.0.1:8787` немесе `0.0.0.0:8787`).

### Cloudflare Quick Tunnel (HTTPS, тегін)

1. [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) орнатыңыз.
2. Терминалда:

```bash
cloudflared tunnel --url http://127.0.0.1:8787
```

3. Шығатын **`https://....trycloudflare.com`** (немесе ұқсас) жолды көшіріңіз.
4. **Raqat мобильді** → Баптаулар → Платформа API → сол URL (соңында `/` жоқ) → **API сақтау**.
5. Телефон браузерінен `https://....../health` ашып JSON көрінетінін тексеріңіз.

Сілтеме әр іске қосқанда өзгеруі мүмкін — тұрақты домен үшін төмендегі VPS бөлімін қолданыңыз.

### ngrok (мысал)

```bash
ngrok http 8787
```

Берілген `https://....ngrok-free.app` жолын қолданбаға жазасыз.

---

## 2) VPS + домен + HTTPS (өндіріс)

### Домен

- DNS: `api.домен.kz` → VPS **A** жазбасы (сервердің public IP).
- Күту: таратылу 5–60 мин болуы мүмкін.

### Firewall (мысал: Ubuntu `ufw`)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

API-ны **тіке 8787** интернетке ашуға болмайды — тек **nginx 443** арқылы проксилаңыз.

### Серверде API (localhost)

`uvicorn` nginx артында **тек ішкі портта**:

```bash
cd platform_api
source .venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8787
```

Өндірісте **systemd** үлгісі: `scripts/systemd/raqat-platform-api.service.example` — түсініктемеде `--host 0.0.0.0` сыртқа тіке ашу үшін; **nginx алдында** әдетте `127.0.0.1` жеткілікті.

### Nginx (TLS + `proxy_pass`)

Let's Encrypt (certbot) немесе Cloudflare Origin Certificate. Мысал идея (`server_name` өз доменіңіз):

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.kz;

    ssl_certificate     /etc/letsencrypt/live/api.example.kz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.kz/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

HTTP → HTTPS редиректі (порт 80) certbot әдетте қосып береді.

### Certbot (nginx плагині)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.kz
```

### Қолданба

- **Мобильді:** `EXPO_PUBLIC_RAQAT_API_BASE=https://api.example.kz` (немесе Баптауларда сақтау).
- **Бот / басқа клиент:** `RAQAT_PLATFORM_URL` / `RAQAT_PLATFORM_API_BASE` сол HTTPS негізгі URL.

---

## 3) Тексеру тізімі

| Тексеру | Команда / әрекет |
|--------|-------------------|
| Liveness | `curl -fsS https://api.example.kz/health` |
| Readiness | `curl -fsS https://api.example.kz/ready` (DB жоқ болса **503**) |
| Телефон | Браузерден `/health` — JSON |
| Redis | Өндірісте `RAQAT_REDIS_URL` дұрыс; әйтпесе API стартуда тоқтайды (`RAQAT_REDIS_REQUIRED=0` тек жергілікті тест үшін) |

---

## 4) Қосымша

- Дайын nginx сниппеттері: `scripts/server_snippets/nginx_raqat_api_http80.conf` (HTTP / certbot алды), `scripts/server_snippets/nginx_raqat_api_https443.conf` (443 үлгісі)
- Nginx идеялары: `infra/nginx/README.md`
- Орта айнымалылар: `platform_api/README.md`, `platform_api/.env.example`
- Docker стек: `infra/docker/README.md`, `docker compose -f infra/docker/docker-compose.stack.yml`

Егер **тек әзірлеу** үшін LAN жеткілікті болса, `uvicorn main:app --host 0.0.0.0 --port 8787` + телефон мен ПК бір Wi‑Fi + APK `network_security_config` ішінде сол IP (немесе `scripts/patch_android_network_security.py` жинақ кезінде).
