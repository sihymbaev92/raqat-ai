from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/i18n/kk.ts"
t = p.read_text(encoding="utf-8")
old = (
    "      \"\u0410\u0443\u0434\u0438\u043e \u0436\u04af\u043a\u0442\u0435\u0443 \u2014 \u0438\u043d\u0442\u0435\u0440\u043d\u0435\u0442 \u043a\u0435\u0440\u0435\u043a"
)
# simpler: replace by key block
marker = "    quranAudioOfflineSub:\n"
idx = t.find(marker)
if idx < 0:
    raise SystemExit("marker not found")
start = idx + len(marker)
end = t.find("\n", start)
line = t[start:end]
new_line = (
    '      "Аудио жүктеу — интернет керек; барлық reciter офлайн емес. '
    'Әр qarиді бөлек жүктейсіз (APK-ға кірмейді). '
    'Бір рет тыңдалған аят кешке түседі. Wi‑Fi әдепкі; мобильді интернет — төмендегі қосқыш.",'
)
t = t[:start] + new_line + t[end:]
p.write_text(t, encoding="utf-8")
print("replaced", line[:60], "->", new_line[:60])
