/** Runtime fetch/cache — Metro бандлда емес, CDN + FileSystem кэш. */
export type BundledJsonName =
  | "surah-list-api.json"
  | "quran-uthmani-full.json"
  | "quran-en-transliteration-full.json"
  | "quran-kk-from-db.json"
  | "quran-translations-offline.json"
  | "offline-auto-translations-core.json"
  | "great-words-catalog.json"
  | "abai-kara-soz-full.json";

/** APK/JS bundle-дан шығарылған ауыр JSON (runtime жүктеледі). */
export const RUNTIME_BUNDLED_JSON: readonly BundledJsonName[] = [
  "surah-list-api.json",
  "quran-uthmani-full.json",
  "quran-en-transliteration-full.json",
  "quran-kk-from-db.json",
  "quran-translations-offline.json",
  "offline-auto-translations-core.json",
] as const;
