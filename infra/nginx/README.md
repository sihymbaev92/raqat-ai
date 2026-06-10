# Nginx / edge (мысал)

Production сызбасында: **Cloudflare (CDN/WAF)** → **Nginx немесе Traefik** → Platform API pods.

Мұнда тек **мысал** сценарий сипаттамасы; толық конфиг ортаңыздың доменіне байланысты.

## API reverse proxy (идея)

- TLS терминациясы edge-те (Cloudflare) немесе nginx-те  
- `proxy_pass` → ішкі `uvicorn` / Gunicorn worker socket  
- Ұзақ AI сұраулары үшін `proxy_read_timeout` арттыру  
- `/health` — load balancer health check үшін жеңіл жол

**VPS қадамдар (HTTP 80 + Certbot HTTPS):** [docs/operations/nginx-certbot-vps.md](../docs/operations/nginx-certbot-vps.md)

Репо түбірінен **мысал server блоктары**: `scripts/server_snippets/nginx_raqat_api_http80.conf`, `scripts/server_snippets/nginx_raqat_api_https443.conf` (`server_name` мен `proxy_pass` портына сәйкес өзгертіңіз; Hetzner VPS әдетте **8000**).
