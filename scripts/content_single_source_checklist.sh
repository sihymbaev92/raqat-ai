#!/usr/bin/env bash
# Бір дерек көзі — контент жаңарғаннан кейін барлық қабаттың сәйкес екенін тексеру үшін қысқа чеклист.
# Қолдану: bash scripts/content_single_source_checklist.sh
# Немесе API мекенжайы: API_BASE=https://example.com:8787 bash scripts/content_single_source_checklist.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_BASE="${API_BASE:-http://127.0.0.1:8787}"
API_BASE="${API_BASE%/}"

echo "=== RAQAT: бір дерек көзі чеклисті ==="
echo ""
echo "1) Дерекқорда quran/hadith үшін updated_at бар (инкременттік синк үшін):"
echo "   SQLite: PRAGMA table_info(quran); PRAGMA table_info(hadith);"
echo "   Ескі quran схемасы: python scripts/upgrade_quran_api_columns_sqlite.py --db global_clean.db"
echo "   (немесе API старту: миграция 17 — surah_name, translit, updated_at)"
echo ""
echo "2) Platform API сол деректі оқиды (resolve_db_path немесе DATABASE_URL)."
echo ""
echo "3) Бот бір көзден оқиды: RAQAT_BOT_API_ONLY=1 + RAQAT_PLATFORM_API_BASE + RAQAT_CONTENT_READ_SECRET"
echo "   немесе боттағы global_clean.db = платформадағы файлдың көшірмесі."
echo ""
echo "4) Мобильді: EXPO_PUBLIC_RAQAT_API_BASE + контент құпиясы (қажет болса)."
echo "   Іске қосу және алдыңғы планға оралғанда contentSync іске қосылады (App.tsx)."
echo ""
echo "5) Офлайн APK: бандл снимогы — жаңа жол үшін экспорт + build:apk немесе онлайн синк."
echo ""
echo "=== API тексеру (${API_BASE}) ==="
if command -v curl >/dev/null 2>&1; then
  echo -n "GET /health: "
  curl -sS -o /dev/null -w "%{http_code}\n" "${API_BASE}/health" || echo "(қате)"
  echo -n "GET /api/v1/stats/content: "
  curl -sS -o /dev/null -w "%{http_code}\n" "${API_BASE}/api/v1/stats/content" || echo "(қате)"
  echo ""
  echo "Мазмұн статистикасы (қысқа):"
  curl -sS "${API_BASE}/api/v1/stats/content" | head -c 800 || true
  echo ""
else
  echo "curl жоқ — API тексеру өткізілді."
fi
echo ""
echo "Толығырақ: ECOSYSTEM.md («Бір дерек көзі»), docs/PLATFORM_GPT_HANDOFF.md §2."
