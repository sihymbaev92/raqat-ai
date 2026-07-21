/**
 * Құран қазақша мағына — аудио қари (Халифа Алтай) бөлек.
 * Snapshot — `mobile/assets/bundled/quran-kk-from-db.json` header-мен синхрон (export script).
 * Runtime: `ensureQuranKkProvenanceLoaded()` бандл metadata-ны оқиды.
 */
export const QURAN_KK_TEXT_ATTRIBUTION_KK = "Халифа Алтай (qurankarim.kz API)";

export const QURAN_KK_MEANING_LABEL_KK = `Мағына (${QURAN_KK_TEXT_ATTRIBUTION_KK})`;

/** Bundled JSON header snapshot (2026-04-25 export). Export кейін жаңартыңыз. */
export const QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT = {
  attributionKk: "asyldin.kz — (Транскрипция) Құранның қазақша жазылуы",
  sourceDetail:
    "https://asyldin.kz/library/readBook/id/29/ | gaps: Uthmani→quran_translit.py | text_kk gaps: qurankarim.kz API (Халифа Алтай)",
  exportedAt: "2026-04-25T06:12:35.079643+00:00",
  meaningLabelKk: "Мағына (Халифа Алтай, qurankarim.kz API)",
  footerLine:
    "Қазақша аят мағынасы (офлайн бандл): qurankarim.kz API (Халифа Алтай). Сілтеме: https://asyldin.kz/library/readBook/id/29/. Транскрипция/қосалқы: asyldin.kz — (Транскрипция) Құранның қазақша жазылуы; gaps: Uthmani→quran_translit.py. Толық мәтін және лицензия — ресми басылым/ҚМДБ.",
} as const;

/** @deprecated — snapshot/footerLine қолданыңыз */
export const QURAN_KK_TEXT_PROVENANCE_KK = QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.footerLine;

const QURAN_KK_TEXT_PROVENANCE_RU =
  "Казахский перевод аятов (офлайн-пакет): API qurankarim.kz (Халифа Алтай). Ссылка: https://asyldin.kz/library/readBook/id/29/. Транскрипция: asyldin.kz. Полный текст и лицензия — официальное издание.";

const QURAN_KK_TEXT_PROVENANCE_EN =
  "Kazakh ayah meanings (offline bundle): qurankarim.kz API (Khalifa Altay). Link: https://asyldin.kz/library/readBook/id/29/. Transcription: asyldin.kz. Full text and license — official edition.";

/** Locale-safe provenance line for settings / about (never leaks Kazakh under non-kk). */
export function quranKkTextProvenanceForLocale(locale: string): string {
  if (locale === "kk") return QURAN_KK_TEXT_PROVENANCE_KK;
  if (locale === "ru") return QURAN_KK_TEXT_PROVENANCE_RU;
  return QURAN_KK_TEXT_PROVENANCE_EN;
}
