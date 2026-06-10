import { bundledJsonRemoteUrl } from "../config/bundledJsonBase";
import type { QuranTranslationLocale } from "./quranTranslationEditions";

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
const FETCH_JSON_MS = 15_000;

let bundle: QuranOfflineBundle = {};
let mapsBySurah: Map<number, QuranOfflineAyah[]> | null = null;
let loadPromise: Promise<void> | null = null;

export async function ensureBundledQuranTranslationsLoaded(): Promise<void> {
  if (bundle.surahs) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl
      ? setTimeout(() => {
          ctrl.abort();
        }, FETCH_JSON_MS)
      : null;
    try {
      const response = await fetch(bundledJsonRemoteUrl("quran-translations-offline.json"), {
        cache: "force-cache",
        signal: ctrl?.signal,
      });
      if (!response.ok) return;
      bundle = (await response.json()) as QuranOfflineBundle;
      mapsBySurah = null;
    } catch {
      bundle = {};
    } finally {
      if (timer) clearTimeout(timer);
    }
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
}

function getSurahRows(surah: number): QuranOfflineAyah[] {
  if (!mapsBySurah) {
    mapsBySurah = new Map();
    for (const row of bundle.surahs ?? []) {
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
