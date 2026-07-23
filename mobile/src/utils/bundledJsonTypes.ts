/** Runtime fetch/cache — Metro бандлда емес, CDN + FileSystem кэш. */

export type BundledJsonName =
  | "surah-list-api.json"
  | "quran-uthmani-full.json"
  | "quran-en-transliteration-full.json"
  | "quran-kk-from-db.json"
  | "quran-translations-offline.json"
  | "quran-tajweed-offline.json"
  | "offline-auto-translations-core.json"
  | "offline-auto-translations-apk.json"
  | "great-words-catalog.json"
  | "abai-kara-soz-full.json"
  | "hadith-from-db-seed.json"
  | "halal-companies-snapshot.json"
  | "mosques-2gis-kz.json";

/** APK: индекс + KK + Arabic + translit + tajweed + ru/en/tr/uz/ky мағына + UI + hadith + asyl soz. */
export const APK_BUNDLED_JSON: readonly BundledJsonName[] = [
  "surah-list-api.json",
  "mosques-2gis-kz.json",
  "quran-kk-from-db.json",
  "quran-uthmani-full.json",
  "quran-en-transliteration-full.json",
  "quran-tajweed-offline.json",
  "quran-translations-offline.json",
  "hadith-from-db-seed.json",
  "offline-auto-translations-apk.json",
  "great-words-catalog.json",
] as const;

/** Орнатудан кейін CDN/cache арқылы жүктеледі. */
export const REMOTE_BUNDLED_JSON: readonly BundledJsonName[] = [
  "offline-auto-translations-core.json",
  "halal-companies-snapshot.json",
] as const;

const REMOTE_SET = new Set<BundledJsonName>(REMOTE_BUNDLED_JSON);
const APK_SET = new Set<BundledJsonName>(APK_BUNDLED_JSON);

export function isRemoteBundledJson(name: BundledJsonName): boolean {
  return REMOTE_SET.has(name);
}

export function isApkBundledJson(name: BundledJsonName): boolean {
  return APK_SET.has(name);
}
