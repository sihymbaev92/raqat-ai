from pathlib import Path

p = Path(__file__).resolve().parents[1] / "src/i18n/kk.ts"
t = p.read_text(encoding="utf-8")

replacements = [
    (
        '    ayahAudioError: "Бұл аяттың дыбысы офлайн cache-те жоқ. Интернет қосылғанда бір рет тыңдасаңыз, кейін офлайн ойналады.",',
        """    ayahAudioError: "Бұл аяттың дыбысы офлайн cache-те жоқ. Интернет қосылғанда бір рет тыңдасаңыз, кейін офлайн ойналады.",
    ayahAudioOfflineError:
      "Интернет жоқ — бұл аят кеште жоқ. Wi‑Fi қосып ойнатыңыз немесе Параметрлер → Қари жүктеу арқылы толық офлайн жүктеңіз.",
    quranAudioStreamingNotice:
      "Қари толығымен офлайн емес: аят дыбысы интернет арқылы ойнайды. Толық офлайн үшін Параметрлер → Қари жүктеу.",""",
    ),
    (
        """    tajweedModeHint:
      "Хатым (QCF4): King Fahd QCF V4 COLR — Sajda сияқты әріп ішіндегі түсті тәжуид (Quran Foundation CDN). Сүре оқу: Al Quran Cloud «quran-tajweed» тегтері. Алдымен қолданба ішіндегі офлайн seed, кейін кеш/API.",""",
        """    tajweedModeHint:
      "Sajda сияқты әріп ішіндегі түсті тәжуид толық емес (QCF4 COLR шектеуі). Хатым QCF4: Android/iOS-та COLR; сәтсіз болса сөз/таг деңгейі. Сүре оқу: Unicode тегтері. Дерек: офлайн seed → кеш/API.",
    tajweedNoticeSurahUnicode:
      "Сүре оқу: Sajda сияқты әріп ішіндегі түс жоқ — Al Quran Cloud «quran-tajweed» Unicode тегтері (сөз деңгейі).",
    tajweedNoticeHatimUnicode:
      "Хатым: QCF4 COLR/web/webp-те әріп ішіндегі түс жоқ — Unicode мәтін режимі (сөз деңгейі).",
    tajweedNoticeHatimColrFallback:
      "QCF4 COLR жүктелмеді — сөз/таг деңгейіндегі түсті тәжуид (Sajda-style in-glyph емес).",""",
    ),
    (
        """    tajweedLegendIntro:
      "Al Quran Cloud «quran-tajweed» — 17 ереже тегі ([h[, [n[, [f[ …). Әр түс бір ережені білдіреді (API tajweed-guide сәйкес). Толық теория — «Тәжуид» бөлімі.",""",
        """    tajweedLegendIntro:
      "Al Quran Cloud «quran-tajweed» — 17 ереже тегі ([h[, [n[, [f[ …). Сүре оқу — сөз деңгейі; хатым QCF4 COLR — әріп ішіндегі түс (Sajda толық парасы емес). Толық теория — «Тәжуид».",""",
    ),
    (
        """    quranAudioOfflineSub:
      "Әр қариді бөлек таңдап жүктейсіз — барлық qarилар автоматты түрде жүктелмейді және APK-ға кірмейді. Wi‑Fi әдепкі, мобильді интернетті бөлек қосасыз.",""",
        """    quranAudioOfflineSub:
      "Аудио жүктеу — интернет керек; барлық reciter офлайн емес. Әр qarиді бөлек жүктейсіз (APK-ға кірмейді). Бір рет тыңдалған аят кешке түседі. Wi‑Fi әдепкі; мобильді интернет — төмендегі қосқыш.",""",
    ),
]

for old, new in replacements:
    if old not in t:
        print("MISSING:", repr(old[:80]))
    else:
        t = t.replace(old, new, 1)

p.write_text(t, encoding="utf-8")
print("patched", p)
