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

function loadBundleFromAsset(): QuranOfflineBundle {
  if (!bundle.surahs) {
    if (process.env.NODE_ENV !== "test") return bundle;
    const testRequire = eval("require") as (path: string) => unknown;
    bundle = testRequire("../../assets/bundled/quran-translations-offline.json") as QuranOfflineBundle;
  }
  return bundle;
}

export async function ensureBundledQuranTranslationsLoaded(): Promise<void> {
  if (bundle.surahs) return;
  if (!loadPromise) {
    loadPromise = loadBundledJson<QuranOfflineBundle>("quran-translations-offline.json")
      .then((loaded) => {
        bundle = loaded;
        mapsBySurah = null;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
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
  const field = FIELD_BY_LOCALE[locale];
  const row = getSurahRows(surah).find((item) => item.numberInSurah === ayah);
  return String(row?.[field] ?? "").trim();
}

/** Құран оқу экранынан шыққанда көптілді offline translation bundle-ын RAM-нан босату. */
export function releaseBundledQuranTranslationsMemory(): void {
  bundle = {};
  mapsBySurah = null;
  loadPromise = null;
  releaseBundledJsonMemory("quran-translations-offline.json");
}
