# VPS: Nginx reverse proxy + Let's Encrypt (Certbot)

Сырттан **80/443** → ішкі **uvicorn `127.0.0.1:8000`** (немесе 8787 — `proxy_pass` портына сәйкес).

**Маңызды:** Let's Encrypt үшін **домен** керек. **Өндіріс (2026):** `rahatomir.com` — API поддомені `api.rahatomir.com` → VPS **A** `5.75.162.140`. Тек IP үшін LE сертификаты әдетте берілмейді.

### DNS (регистратор панелі — rahatomir.com)

| Түр | Атау (host) | Мән | TTL |
|-----|-------------|-----|-----|
| **A** | `api` | `5.75.162.140` | 300–3600 |
| **A** (опция) | `@` | VPS IP (мысалы `5.75.162.140`) | сайт + API бір серверде |
| **CNAME** (опция) | `www` | `rahatomir.com` | — |

Таралуды тексеру (5–60 мин):

```bash
dig +short api.rahatomir.com A
# күтілетін: 5.75.162.140
```

---

## 0. Алдын ала

| Талап | Тексеру |
|--------|---------|
| API ішкі портта | `curl -s http://127.0.0.1:8000/health` → `{"status":"ok",...}` |
| systemd | `sudo systemctl is-active raqat-platform-api` → `active` |
| Firewall | `sudo ufw allow 80/tcp` және `443/tcp` |
| DNS | `api.rahatomir.com` → `5.75.162.140` (A жазба) |

---

## 1. Nginx орнату

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 2. HTTP (80) — reverse proxy

**Мысал:** `api.rahatomir.com` (өз доменіңізбен ауыстырыңыз).

```bash
sudo tee /etc/nginx/sites-available/raqat-api << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name api.rahatomir.com;

    client_max_body_size 32m;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/raqat-api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Сырттан (DNS дайын болса):

```bash
curl -s http://api.rahatomir.com/health
```

Репода сниппет: `scripts/server_snippets/nginx_raqat_api_http80.conf` (портты өзгертіңіз).

---

## 3. SSL (HTTPS) — Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.rahatomir.com
```

Интерактивті сұрақтар: email, Terms, HTTP→HTTPS редирект — **2** (Redirect) ұсынылады.

Certbot nginx конфигін өзі жаңартады (`ssl_certificate` жолдарын қосады).

Тексеру:

```bash
curl -fsS https://api.rahatomir.com/health
curl -fsS https://api.rahatomir.com/ready
sudo certbot renew --dry-run
```

Автожаңарту: `certbot` systemd timer әдетте орнатылады (`systemctl list-timers | grep certbot`).

---

## 4. Тек IP (домен жоқ) — уақытша HTTP

Тест үшін (HTTPS жоқ):

```bash
sudo tee /etc/nginx/sites-available/raqat-api-ip << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
EOF
sudo ln -sf /etc/nginx/sites-available/raqat-api-ip /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

```bash
curl -s http://5.75.162.140/health
```

Мобильді: `http://5.75.162.140` — Android `network_security_config` ішінде IP рұқсат етілуі керек; өндіріс үшін **HTTPS + домен** ұсынылады.

---

## 5. uvicorn порты 8787 болса

`proxy_pass` және systemd `ExecStart` бір портта болсын:

```nginx
proxy_pass http://127.0.0.1:8787;
```

---

## 6. Қолданба / бот

| Клиент | Мән |
|--------|-----|
| Мобильді | `https://api.rahatomir.com` (Баптаулар → API) |
| Бот `.env` | `RAQAT_PLATFORM_API_BASE=https://api.rahatomir.com` |
| `app.json` / EAS | `EXPO_PUBLIC_RAQAT_API_BASE` сол URL |

---

## 7. Жиі қателер

| Белгі | Шешім |
|-------|--------|
| **502 Bad Gateway** | API жұмыс істемейді: `curl http://127.0.0.1:8000/health`; systemd журналы |
| **504 Gateway Timeout** | `proxy_read_timeout 300s;` арттыру (AI ұзақ жауап) |
| Certbot домен табпайды | DNS A жазбасы дайын ба, `dig api.домен.kz` |
| 203/EXEC (API) | `WorkingDirectory=/opt/raqat-ai/platform_api`, `python -m uvicorn main:app` |

---

[← operations/README.md](README.md) · [VPS_PRODUCTION_PLATFORM_API.md](../VPS_PRODUCTION_PLATFORM_API.md)
