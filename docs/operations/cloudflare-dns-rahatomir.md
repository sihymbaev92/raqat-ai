# Cloudflare: rahatomir.com → VPS

Домен **Cloudflare DNS** арқылы жүргізіледі (SOA: `cloudflare.com`).

## DNS жазбалары

Cloudflare Dashboard → **rahatomir.com** → **DNS** → **Records**:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | `5.75.162.140` | **DNS only** (сұр бұлт OFF) |
| **A** | `api` | `5.75.162.140` | DNS only |
| **CNAME** (опция) | `www` | `rahatomir.com` | DNS only |

| Домен | Мазмұны |
|-------|---------|
| **rahatomir.com** | Expo web қолданба — [web-app-deploy.md](web-app-deploy.md) |
| **api.rahatomir.com** | Platform API |

**Прокси (қызыл/сары бұлт) OFF** — Certbot және тікелей uvicorn байланысы оңайырақ.

## VPS: API + веб

```bash
ssh root@5.75.162.140
cd /opt/raqat-ai && git pull
sudo bash scripts/vps-setup-rahatomir.sh
sudo RUN_CERTBOT=1 bash scripts/vps-setup-rahatomir.sh
```

Веб-қолданба (компьютерден):

```bash
bash scripts/vps_deploy_web.sh
```

SSL (барлық домен):

```bash
sudo certbot --nginx -d rahatomir.com -d www.rahatomir.com -d api.rahatomir.com
```

## Тексеру

```bash
curl -fsS https://rahatomir.com/ | head -c 80
curl -fsS https://api.rahatomir.com/health
```

[← nginx-certbot-vps.md](nginx-certbot-vps.md)
