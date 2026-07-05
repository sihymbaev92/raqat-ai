/** Release APK stash/strip — CDN + FileSystem cache (rahatomir.com/assets/bundled). */
export const APK_SLIM_REMOTE_JSON = [
  "offline-auto-translations-core.json",
  "quran-translations-offline.json",
  "quran-kk-from-db.json",
  "quran-en-transliteration-full.json",
  "quran-tajweed-offline.json",
  "scraped-hadith-muftyat.json",
  "extracted-hadith-muftyat.json",
  "external-hadith-kk.json",
  "hadith-from-db-seed.json",
  "great-words-catalog.json",
  "halal-companies-snapshot.json",
  "mosques-2gis-kz.json",
] as const;

export type ApkSlimRemoteJsonName = (typeof APK_SLIM_REMOTE_JSON)[number];
