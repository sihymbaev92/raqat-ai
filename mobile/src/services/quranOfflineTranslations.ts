import type { QuranTranslationLocale } from "./quranTranslationEditions";
import { loadBundledJson, releaseBundledJsonMemory } from "../utils/loadBundledJson";

type QuranOfflineAyah = {
  numberInSurah: number;
  textRu?: string;
  textEn?: string;
  textTr?: string;
  textUz?: string;
  textKy?: string;
  textZh?: string;
  textFa?: string;
  textId?: string;
  textMs?: string;
  textHi?: string;
  textKu?: string;
};

type QuranOfflineSurah = {
  number: number;
  ayahs: QuranOfflineAyah[];
};

type QuranOfflineBundle = {
  version?: number;
  source?: string;
  generatedAt?: string;
  surahs?: QuranOfflineSurah[];
};

const FIELD_BY_LOCALE: Record<QuranTranslationLocale, keyof QuranOfflineAyah> = {
  ru: "textRu",
  en: "textEn",
  tr: "textTr",
  uz: "textUz",
  ky: "textKy",
  zh: "textZh",
  fa: "textFa",
  id: "textId",
  ms: "textMs",
  hi: "textHi",
  ku: "textKu",
};

const OFFLINE_TRANSLATION_LOCALES = Object.keys(FIELD_BY_LOCALE);

let bundle: QuranOfflineBundle = {};
let mapsBySurah: Map<number, QuranOfflineAyah[]> | null = null;
let loadPromise: Promise<void> | null = null;
let projectedLocale: QuranTranslationLocale | null = null;

function loadBundleFromAsset(): QuranOfflineBundle {
  if (!bundle.surahs) {
    if (process.env.NODE_ENV !== "test") return bundle;
    const testRequire = eval("require") as (path: string) => unknown;
    bundle = testRequire("../../assets/bundled/quran-translations-offline.json") as QuranOfflineBundle;
  }
  return bundle;
}

function reloadFullBundledTranslationsFromAsset(): void {
  bundle = {};
  mapsBySurah = null;
  projectedLocale = null;
  loadBundleFromAsset();
  if (!bundle.surahs?.length && process.env.NODE_ENV === "test") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      bundle = require("../../assets/bundled/quran-translations-offline.json") as QuranOfflineBundle;
    } catch {
      /* test asset missing */
    }
  }
}

/** Синхрон аят мағынасы: bundle жүктеліп, сұралған тілге проекцияланған болуы керек. */
export function ensureBundledQuranTranslationLocaleSync(locale: QuranTranslationLocale): void {
  if (!bundle.surahs?.length) {
    if (process.env.NODE_ENV === "test") {
      reloadFullBundledTranslationsFromAsset();
    }
    return;
  }
  if (projectedLocale != null && projectedLocale !== locale) {
    if (process.env.NODE_ENV === "test") {
      reloadFullBundledTranslationsFromAsset();
    } else {
      void ensureBundledQuranTranslationsLoaded(locale);
      return;
    }
  }
  projectBundledQuranTranslationsToLocale(locale);
}

/** ~18 MB көптілді bundle-ды белсенді тіл өрісіне қысу. */
export function projectBundledQuranTranslationsToLocale(locale: QuranTranslationLocale): void {
  if (!bundle.surahs?.length) return;
  if (projectedLocale === locale) return;
  const field = FIELD_BY_LOCALE[locale];
  bundle = {
    version: bundle.version,
    source: bundle.source,
    generatedAt: bundle.generatedAt,
    surahs: bundle.surahs.map((surah) => ({
      number: surah.number,
      ayahs: (surah.ayahs ?? []).map((ayah) => {
        const slim: QuranOfflineAyah = { numberInSurah: ayah.numberInSurah };
        const text = ayah[field];
        if (typeof text === "string" && text.trim()) {
          (slim as unknown as Record<string, string>)[field] = text;
        }
        return slim;
      }),
    })),
  };
  mapsBySurah = null;
  projectedLocale = locale;
}

export async function ensureBundledQuranTranslationsLoaded(
  locale?: QuranTranslationLocale
): Promise<void> {
  if (bundle.surahs?.length) {
    if (locale && projectedLocale && projectedLocale !== locale) {
      /** Басқа тілге қысқартылған — толық файлды қайта жүктеу. */
      bundle = {};
      mapsBySurah = null;
      projectedLocale = null;
    } else {
      if (locale) projectBundledQuranTranslationsToLocale(locale);
      return;
    }
  }

  if (!loadPromise) {
    loadPromise = loadBundledJson<QuranOfflineBundle>("quran-translations-offline.json")
      .then((loaded) => {
        bundle = loaded;
        mapsBySurah = null;
        projectedLocale = null;
        try {
          releaseBundledJsonMemory("quran-translations-offline.json");
        } catch {
          /* test mocks */
        }
        if (locale) projectBundledQuranTranslationsToLocale(locale);
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  await loadPromise;
  if (locale && bundle.surahs?.length) {
    projectBundledQuranTranslationsToLocale(locale);
  }
}

export function prefetchBundledQuranTranslations(): Promise<void> {
  return ensureBundledQuranTranslationsLoaded().catch(() => {});
}

function getSurahRows(surah: number): QuranOfflineAyah[] {
  if (!mapsBySurah) {
    mapsBySurah = new Map();
    for (const row of loadBundleFromAsset().surahs ?? []) {
      if (typeof row.number === "number" && Array.isArray(row.ayahs)) {
        mapsBySurah.set(row.number, row.ayahs);
      }
    }
  }
  return mapsBySurah.get(surah) ?? [];
}

export function getBundledQuranSurahTranslation(
  surah: number,
  locale: QuranTranslationLocale
): Record<number, string> | null {
  const field = FIELD_BY_LOCALE[locale];
  const rows = getSurahRows(surah);
  if (!rows.length) return null;

  const out: Record<number, string> = {};
  for (const ayah of rows) {
    const text = String(ayah[field] ?? "").trim();
    if (typeof ayah.numberInSurah === "number" && text) {
      out[ayah.numberInSurah] = text;
    }
  }
  return Object.keys(out).length ? out : null;
}

export function isBundledQuranTranslationLocale(locale: string): locale is QuranTranslationLocale {
  return OFFLINE_TRANSLATION_LOCALES.includes(locale);
}

export function getBundledQuranAyahTranslation(
  surah: number,
  ayah: number,
  locale: string
): string {
  if (!isBundledQuranTranslationLocale(locale)) return "";
  ensureBundledQuranTranslationLocaleSync(locale);
  const field = FIELD_BY_LOCALE[locale];
  const row = getSurahRows(surah).find((item) => item.numberInSurah === ayah);
  return String(row?.[field] ?? "").trim();
}

export async function searchBundledQuranTranslations(
  query: string,
  limit = 40,
  locale: QuranTranslationLocale = "ru"
): Promise<Array<{ surah: number; ayah: number; meaning: string }>> {
  const needle = query.toLowerCase().normalize("NFKC").trim();
  if (needle.length < 2) return [];
  await ensureBundledQuranTranslationsLoaded(locale);
  const field = FIELD_BY_LOCALE[locale];
  const cap = Math.max(1, Math.min(limit, 120));
  const hits: Array<{ surah: number; ayah: number; meaning: string }> = [];
  for (const surah of loadBundleFromAsset().surahs ?? []) {
    if (typeof surah.number !== "number") continue;
    for (const ayah of surah.ayahs ?? []) {
      const text = String(ayah[field] ?? "").trim();
      if (!text || typeof ayah.numberInSurah !== "number") continue;
      if (!text.toLowerCase().normalize("NFKC").includes(needle)) continue;
      hits.push({ surah: surah.number, ayah: ayah.numberInSurah, meaning: text });
      if (hits.length >= cap) return hits;
    }
  }
  return hits;
}

/** Құран оқу экранынан шыққанда offline translation bundle-ын RAM-нан босату. */
export function releaseBundledQuranTranslationsMemory(): void {
  bundle = {};
  mapsBySurah = null;
  loadPromise = null;
  projectedLocale = null;
  try {
    releaseBundledJsonMemory("quran-translations-offline.json");
  } catch {
    /* test mocks may omit releaseBundledJsonMemory */
  }
}
