#!/usr/bin/env bash
# Metro — 0.0.0.0 тыңдайды; манифестке тек жарамды IPv4 түседі (Expo Go үшін).
set -euo pipefail
cd "$(dirname "$0")/.."

export EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

is_ipv4() {
  echo "$1" | awk -F. 'NF==4 {
    for (i = 1; i <= 4; i++) {
      if ($i !~ /^[0-9]+$/) exit 1
      if ($i > 255) exit 1
    }
    exit 0
  } { exit 1 }' >/dev/null 2>&1
}

USER_HOST="${REACT_NATIVE_PACKAGER_HOSTNAME:-}"

if [[ -n "$USER_HOST" ]]; then
  if is_ipv4 "$USER_HOST"; then
    echo "REACT_NATIVE_PACKAGER_HOSTNAME=$USER_HOST (сіздің орнату)"
  else
    echo ""
    echo "=== ҚАТЕ ==="
    echo "REACT_NATIVE_PACKAGER_HOSTNAME=\"$USER_HOST\" — бұл нақты IP емес."
    echo "Ортада ескі үлгі қалған болуы мүмкін. Терминалда орындаңыз:"
    echo "  unset REACT_NATIVE_PACKAGER_HOSTNAME"
    echo "Содан кейін қайта: npm run start:vps"
    echo "Немесе тек сандар: export REACT_NATIVE_PACKAGER_HOSTNAME=95.216.1.2"
    echo "============"
    echo ""
    echo "Автоматты жария IP ізделуде..."
    unset REACT_NATIVE_PACKAGER_HOSTNAME
    USER_HOST=""
  fi
fi

if [[ -z "${REACT_NATIVE_PACKAGER_HOSTNAME:-}" ]]; then
  IP=""
  for url in https://ifconfig.me/ip https://api.ipify.org https://icanhazip.com; do
    IP=$(curl -4 -fsS --max-time 8 "$url" 2>/dev/null | tr -d '\r\n \t' || true)
    if is_ipv4 "$IP"; then
      break
    fi
    IP=""
  done
  if [[ -z "$IP" ]]; then
    CAND=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
    if is_ipv4 "$CAND"; then
      IP="$CAND"
    fi
  fi
  if [[ -z "$IP" ]] || ! is_ipv4 "$IP"; then
    echo "Жария IP табылмады. Қолмен (тек IPv4, мысалы 95.216.1.2):"
    echo "  export REACT_NATIVE_PACKAGER_HOSTNAME=СІЗДІҢ_IP"
    echo "  npm run start:vps"
    exit 1
  fi
  export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"
fi

# Түбір репо .env + mobile/.env: RAQAT_* → EXPO_PUBLIC_* (Halal AI, API base)
MOBILE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$MOBILE_ROOT/scripts/load-raqat-expo-env.sh"
# Телефон 127.0.0.1 / localhost-қа қосыла алмайды — Metro host (жария IPv4) + порт
_pub="${REACT_NATIVE_PACKAGER_HOSTNAME}"
_base="${EXPO_PUBLIC_RAQAT_API_BASE:-}"
if [[ -n "$_base" ]] && [[ -n "$_pub" ]]; then
  if [[ "$_base" == *"127.0.0.1"* ]] || [[ "$_base" == *"localhost"* ]]; then
    _port="8787"
    if [[ "$_base" =~ :([0-9]+) ]]; then
      _port="${BASH_REMATCH[1]}"
    fi
    export EXPO_PUBLIC_RAQAT_API_BASE="http://${_pub}:${_port}"
    echo "EXPO_PUBLIC_RAQAT_API_BASE → телефон үшін жария хостқа ауыстырылды (порт ${_port})."
  fi
fi
if [[ -n "${EXPO_PUBLIC_RAQAT_API_BASE:-}" ]]; then
  echo "EXPO_PUBLIC_RAQAT_API_BASE=${EXPO_PUBLIC_RAQAT_API_BASE}"
fi
if [[ -n "${EXPO_PUBLIC_RAQAT_AI_SECRET:-}" ]]; then
  echo "EXPO_PUBLIC_RAQAT_AI_SECRET=***орнатылған***"
else
  echo "Ескерту: EXPO_PUBLIC_RAQAT_AI_SECRET бос — түбір .env-те RAQAT_AI_PROXY_SECRET немесе mobile/.env қосыңыз."
fi

echo "Metro host (Expo Go): $REACT_NATIVE_PACKAGER_HOSTNAME"
exec npx expo start --lan
