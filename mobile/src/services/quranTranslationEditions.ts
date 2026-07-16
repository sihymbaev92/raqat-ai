/**
 * Құран аудармасын тіл бойынша жүктеу. Дін мәтіні болғандықтан
 * машиналық аударма емес, дайын тексерілген басылымдар қолданылады:
 *   ru → Эльмир Кулиев (alquran.cloud `ru.kuliev`)
 *   en → Sahih International (alquran.cloud `en.sahih`)
 *   tr/uz/zh/fa/id/ms/hi/ku → alquran.cloud дайын edition-дары
 *   ky → QuranEnc `kyrgyz_hakimov` (alquran.cloud ky.borubaev араб мәтінін қайтарады)
 *
 * kk — bundled/platform дерегінен келеді, ar — түпнұсқа араб мәтіні.
 * ru/en/tr/uz/ky/zh/fa/id/ms/hi/ku алдымен offline bundled JSON-нан оқылады; желі тек bundle-де
 * жоқ мәтінге fallback ретінде қолданылады.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CachedAyah } from "../storage/quranSurahCache";
import type { MushafBookPageSlice } from "../quran/mushafBookTypes";
import {
  ensureBundledQuranTranslationsLoaded,
  getBundledQuranSurahTranslation,
} from "./quranOfflineTranslations";

export const QURAN_TRANSLATION_LOCALES = [
  "ru",
  "en",
  "tr",
  "uz",
  "ky",
  "zh",
  "fa",
  "id",
  "ms",
  "hi",
  "ku",
] as const;
export type QuranTranslationLocale = (typeof QURAN_TRANSLATION_LOCALES)[number];
export type QuranTranslationField =
  | "textRu"
  | "textEn"
  | "textTr"
  | "textUz"
  | "textKy"
  | "textZh"
  | "textFa"
  | "textId"
  | "textMs"
  | "textHi"
  | "textKu";

const EDITION_BY_LOCALE: Record<QuranTranslationLocale, string> = {
  ru: "ru.kuliev",
  en: "en.sahih",
  tr: "tr.diyanet",
  uz: "uz.sodik",
  ky: "quranenc:kyrgyz_hakimov",
  zh: "zh.jian",
  fa: "fa.makarem",
  id: "id.indonesian",
  ms: "ms.basmeih",
  hi: "hi.hindi",
  ku: "ku.asan",
};

const FIELD_BY_LOCALE: Record<QuranTranslationLocale, QuranTranslationField> = {
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

const FETCH_TIMEOUT_MS = 12000;

function cacheKey(surah: number, locale: QuranTranslationLocale): string {
  return `quran_tr_${EDITION_BY_LOCALE[locale]}_${surah}`;
}

type TranslationMap = Record<number, string>;

export function isQuranTranslationLocale(locale: string): locale is QuranTranslationLocale {
  return (QURAN_TRANSLATION_LOCALES as readonly string[]).includes(locale);
}

export function quranTranslationFieldForLocale(locale: QuranTranslationLocale): QuranTranslationField {
  return FIELD_BY_LOCALE[locale];
}

async function loadCachedTranslation(
  surah: number,
  locale: QuranTranslationLocale
): Promise<TranslationMap | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(surah, locale));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TranslationMap;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

async function saveCachedTranslation(
  surah: number,
  locale: QuranTranslationLocale,
  map: TranslationMap
): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(surah, locale), JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function parseAlquranTranslation(j: unknown): TranslationMap | null {
  const code = (j as { code?: number })?.code;
  const ayahs = (j as { data?: { ayahs?: unknown[] } })?.data?.ayahs;
  if (code !== 200 || !Array.isArray(ayahs) || !ayahs.length) return null;
  const out: TranslationMap = {};
  for (const raw of ayahs) {
    const a = raw as { numberInSurah?: number; text?: string };
    if (typeof a.numberInSurah === "number" && typeof a.text === "string") {
      const t = a.text.trim();
      if (t) out[a.numberInSurah] = t;
    }
  }
  return Object.keys(out).length ? out : null;
}

function parseQuranEncTranslation(j: unknown): TranslationMap | null {
  const rows = (j as { result?: unknown[] })?.result;
  if (!Array.isArray(rows) || !rows.length) return null;
  const out: TranslationMap = {};
  for (const raw of rows) {
    const row = raw as { aya?: number | string; translation?: string };
    const n = typeof row.aya === "number" ? row.aya : Number(row.aya);
    if (Number.isFinite(n) && n > 0 && typeof row.translation === "string") {
      const t = row.translation.trim();
      if (t) out[n] = t;
    }
  }
  return Object.keys(out).length ? out : null;
}

async function fetchTranslationFromApi(
  surah: number,
  locale: QuranTranslationLocale
): Promise<TranslationMap | null> {
  const edition = EDITION_BY_LOCALE[locale];
  const isQuranEnc = edition.startsWith("quranenc:");
  const url = isQuranEnc
    ? `https://quranenc.com/api/v1/translation/sura/${edition.slice("quranenc:".length)}/${surah}`
    : `https://api.alquran.cloud/v1/surah/${surah}/${edition}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const j = (await res.json()) as unknown;
    return isQuranEnc ? parseQuranEncTranslation(j) : parseAlquranTranslation(j);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Кэштен немесе желіден сүре аудармасын алу (кэш басым; жоқ болса желі). */
export async function getQuranSurahTranslation(
  surah: number,
  locale: QuranTranslationLocale
): Promise<TranslationMap | null> {
  await ensureBundledQuranTranslationsLoaded(locale);
  const bundled = getBundledQuranSurahTranslation(surah, locale);
  if (bundled) return bundled;

  const cached = await loadCachedTranslation(surah, locale);
  if (cached) return cached;
  const fresh = await fetchTranslationFromApi(surah, locale);
  if (fresh) await saveCachedTranslation(surah, locale, fresh);
  return fresh;
}

/** Аударма мәтінін аят тізіміне textRu/textEn ретінде енгізу. */
export function mergeTranslationIntoAyahs(
  ayahs: CachedAyah[],
  locale: QuranTranslationLocale,
  map: TranslationMap
): CachedAyah[] {
  const field = FIELD_BY_LOCALE[locale];
  return ayahs.map((a) => {
    const t = map[a.numberInSurah];
    if (!t) return a;
    return { ...a, [field]: t };
  });
}

export function mergeTranslationIntoMushafPages(
  pages: MushafBookPageSlice[],
  locale: QuranTranslationLocale,
  surah: number,
  map: TranslationMap
): MushafBookPageSlice[] {
  const field = FIELD_BY_LOCALE[locale];
  let changed = false;
  const next = pages.map((page) => {
    let pageChanged = false;
    const ayahs = page.ayahs.map((a) => {
      if (a.surahNumber !== surah) return a;
      const t = (map[a.numberInSurah] ?? "").trim();
      if (!t || ((a[field] as string | undefined) ?? "").trim() === t) return a;
      pageChanged = true;
      changed = true;
      return { ...a, [field]: t };
    });
    return pageChanged ? { ...page, ayahs } : page;
  });
  return changed ? next : pages;
}

/** Бұл аят тізімінде таңдалған тіл аудармасы әлдеқашан бар ма. */
export function ayahsHaveTranslation(
  ayahs: CachedAyah[],
  locale: QuranTranslationLocale
): boolean {
  if (!ayahs.length) return false;
  const field = FIELD_BY_LOCALE[locale];
  return ayahs.some((a) => ((a[field] as string | undefined) ?? "").trim().length > 0);
}
