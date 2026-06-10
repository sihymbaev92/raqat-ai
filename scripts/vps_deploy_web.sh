#!/usr/bin/env bash
# Expo web → rahatomir.com (VPS static + nginx)
#
# Алдына: .env.deploy (SSH) және mobile/.env.production (API URL)
#   cp .env.deploy.example .env.deploy
#   cp mobile/.env.production.example mobile/.env.production
#
# Қолдану:
#   bash scripts/vps_deploy_web.sh
#   bash scripts/vps_deploy_web.sh --skip-build   # dist бар болса
#
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f "${REPO_ROOT}/.env.deploy" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${REPO_ROOT}/.env.deploy"
  set +a
fi

HOST="${RAQAT_VPS_HOST:-5.75.162.140}"
USER="${RAQAT_VPS_USER:-root}"
WEB_ROOT="${RAQAT_VPS_WEB_ROOT:-/var/www/raqat-web/dist}"
SSH_EXTRA="${RAQAT_VPS_SSH_OPTS:--o StrictHostKeyChecking=accept-new}"
WEB_URL="${RAQAT_WEB_PUBLIC_URL:-https://rahatomir.com}"

SKIP_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
  esac
done

SSH=(ssh)
RSYNC=(rsync -az --human-readable --delete)
# shellcheck disable=SC2206
SSH+=($SSH_EXTRA)
RSYNC+=(-e "ssh ${SSH_EXTRA}")
SSH_TARGET="${USER}@${HOST}"

if [[ "$SKIP_BUILD" != "1" ]]; then
  echo "== web export =="
  (cd "${REPO_ROOT}/mobile" && npm run export:web)
fi

[[ -f "${REPO_ROOT}/mobile/dist/index.html" ]] || {
  echo "ERROR: mobile/dist/index.html жоқ — алдымен npm run export:web" >&2
  exit 1
}

echo "== rsync dist → ${SSH_TARGET}:${WEB_ROOT} =="
"${SSH[@]}" -o BatchMode=yes -o ConnectTimeout=15 "${SSH_TARGET}" \
  "mkdir -p '${WEB_ROOT}' && chown -R www-data:www-data /var/www/raqat-web 2>/dev/null || true"

"${RSYNC[@]}" "${REPO_ROOT}/mobile/dist/" "${SSH_TARGET}:${WEB_ROOT}/"

echo "== post-deploy: prune + gzip =="
"${SSH[@]}" "${SSH_TARGET}" "bash -s -- '${WEB_ROOT}'" < "${REPO_ROOT}/scripts/web-dist-postdeploy.sh"

echo "== nginx web + api split configs =="
for f in nginx_raqat_web_app.conf nginx_raqat_api_vps_live.conf; do
  "${RSYNC[@]}" "${REPO_ROOT}/scripts/server_snippets/${f}" \
    "${SSH_TARGET}:/etc/nginx/sites-available/${f%.conf}"
done

"${SSH[@]}" "${SSH_TARGET}" bash -s <<'REMOTE'
set -euo pipefail
ln -sf /etc/nginx/sites-available/nginx_raqat_web_app /etc/nginx/sites-enabled/raqat-web
ln -sf /etc/nginx/sites-available/nginx_raqat_api_vps_live /etc/nginx/sites-enabled/raqat-api
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
REMOTE

echo ""
echo "== smoke: ${WEB_URL} =="
if curl -fsS --connect-timeout 15 "${WEB_URL}/" | head -c 120 | grep -qi html; then
  echo "OK: ${WEB_URL} HTML қайтарды"
else
  echo "WARN: ${WEB_URL} — HTML көрінбеді (DNS/SSL/nginx/certbot тексеріңіз)" >&2
  echo "  DNS: @ A → ${HOST}, www CNAME → rahatomir.com"
  echo "  SSL: sudo certbot --nginx -d rahatomir.com -d www.rahatomir.com -d api.rahatomir.com"
fi

for asset in \
  /assets/bundled/hadith-from-db-seed.json \
  /assets/bundled/quran-translations-offline.json \
  /assets/bundled/offline-auto-translations-core.json; do
  code="$(curl -fsS -o /dev/null -w '%{http_code}' --connect-timeout 15 "${WEB_URL}${asset}" || true)"
  echo "ASSET ${code} ${WEB_URL}${asset}"
  if [[ "$code" != "200" ]]; then
    echo "ERROR: runtime bundled JSON missing: ${asset}" >&2
    exit 1
  fi
done

echo ""
echo "Дайын: ${WEB_URL}"
echo "API: https://api.rahatomir.com/health"
