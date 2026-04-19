# Nginx / edge (мысал)

Production сызбасында: **Cloudflare (CDN/WAF)** → **Nginx немесе Traefik** → Platform API pods.

Мұнда тек **мысал** сценарий сипаттамасы; толық конфиг ортаңыздың доменіне байланысты.

## API reverse proxy (идея)

- TLS терминациясы edge-те (Cloudflare) немесе nginx-те  
- `proxy_pass` → ішкі `uvicorn` / Gunicorn worker socket  
- Ұзақ AI сұраулары үшін `proxy_read_timeout` арттыру  
- `/health` — load balancer health check үшін жеңіл жол

Кейін: `nginx.conf.example` файлын нақты upstream host-пен толтыру.
