# Веб-сайт: RAQAT қолданбасын **rahatomir.com** арқылы тексеру

| Домен | Мазмұны |
|-------|---------|
| **https://rahatomir.com** | Expo web (қолданба UI) |
| **https://api.rahatomir.com** | Platform API |

---

## 1. DNS (Cloudflare)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | `5.75.162.140` | DNS only (сұр бұлт OFF) |
| **A** | `api` | `5.75.162.140` | DNS only |
| **CNAME** | `www` | `rahatomir.com` | DNS only |

Тексеру:

```bash
dig +short rahatomir.com A
dig +short api.rahatomir.com A
```

---

## 2. Бір командамен deploy (компьютер → VPS)

```bash
cp .env.deploy.example .env.deploy
cp mobile/.env.production.example mobile/.env.production
bash scripts/vps_deploy_web.sh
```

Windows (Git Bash / WSL):

```bash
bash scripts/vps_deploy_web.sh
```

Скрипт: `npm run export:web` → `mobile/dist/` → VPS `/var/www/raqat-web/dist/` + nginx конфиг.

---

## 3. SSL (бірінші рет VPS-те)

DNS таралғаннан кейін:

```bash
ssh root@5.75.162.140
sudo certbot --nginx -d rahatomir.com -d www.rahatomir.com -d api.rahatomir.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## 4. Тексеру

- https://rahatomir.com — қолданба ашылады
- https://api.rahatomir.com/health — `{"status":"ok",...}`
- Қолданба **Баптаулар** → API: `https://api.rahatomir.com`

---

## Жылдам (уақытша) сілтеме

Компьютерде tunnel (тек demo):

```bash
cd mobile && npx expo start --web --tunnel
```

---

## Жаңарту

```bash
bash scripts/vps_deploy_web.sh
bash scripts/vps_deploy_web.sh --skip-build
```

Nginx: `scripts/server_snippets/nginx_raqat_web_app.conf`

---

## Вебте шектеулер

Push-хабарлама, камера/штрихкод — шектеулі. Намаз, Құран, AI (кірумен) — жұмыс істейді.

[← Cloudflare DNS](cloudflare-dns-rahatomir.md) · [nginx + certbot](nginx-certbot-vps.md)
