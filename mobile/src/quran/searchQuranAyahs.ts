import type { AppLocale } from "../i18n/runtime";
import {
  prefetchBundledQuranTranslations,
  searchBundledQuranTranslations,
} from "../services/quranOfflineTranslations";
import {
  isQuranTranslationLocale,
  type QuranTranslationLocale,
} from "../services/quranTranslationEditions";
import {
  searchBundledArabicAyahs,
} from "../services/bundledQuranReader";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import {
  fetchPlatformQuranSearch,
  type PlatformQuranSearchItem,
} from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";
import {
  ensureQuranKkSearchIndex,
  prefetchQuranKkSearchIndex,
  searchQuranKkIndex,
} from "./quranKkSearchIndex";

export type QuranAyahSearchHit = {
  surah: number;
  ayah: number;
  meaning: string;
};

export {
  prefetchQuranKkSearchIndex,
  ensureQuranKkSearchIndex,
  isQuranKkSearchIndexReady,
} from "./quranKkSearchIndex";

function mapPlatformHit(row: PlatformQuranSearchItem, locale: AppLocale): QuranAyahSearchHit | null {
  const surah = row.surah;
  const ayah = row.ayah;
  if (typeof surah !== "number" || typeof ayah !== "number") return null;
  const meaning = (
    locale === "ar"
      ? (row.text_ar ?? row.translit ?? row.text_tr ?? "")
      : (row.text_tr ?? row.translit ?? row.text_ar ?? "")
  )
    .toString()
    .trim();
  if (!meaning) return null;
  return { surah, ayah, meaning };
}

function hitKey(row: QuranAyahSearchHit): string {
  return `${row.surah}:${row.ayah}`;
}

function mergeSearchHits(
  primary: QuranAyahSearchHit[],
  extra: QuranAyahSearchHit[],
  limit: number
): QuranAyahSearchHit[] {
  const seen = new Set<string>();
  const out: QuranAyahSearchHit[] = [];
  for (const row of [...primary, ...extra]) {
    const key = hitKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

/** API lang= параметрі — kk/ru/en/ky/uz және басқа аударма тілдері. */
export function quranSearchLangForLocale(locale: AppLocale): string {
  if (locale === "kk" || locale === "ar") return "kk";
  if (isQuranTranslationLocale(locale)) return locale;
  return "kk";
}

function hasArabicScript(query: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(query);
}

/** Офлайн іздеу — app locale бойынша сәйкес аударма дерегінен. */
export async function searchQuranAyahsLocal(
  query: string,
  limit = 80,
  locale: AppLocale = "kk"
): Promise<QuranAyahSearchHit[]> {
  if (locale === "kk") {
    const kkHits = await searchQuranKkIndex(query, limit);
    if (!hasArabicScript(query)) return kkHits;
    const arHits = searchBundledArabicAyahs(query, limit);
    if (!arHits.length) return kkHits;
    if (!kkHits.length) return arHits;
    return mergeSearchHits(kkHits, arHits, limit);
  }
  if (locale === "ar") {
    return searchBundledArabicAyahs(query, limit);
  }
  if (isQuranTranslationLocale(locale)) {
    return searchBundledQuranTranslations(query, limit, locale as QuranTranslationLocale);
  }
  return searchQuranKkIndex(query, limit);
}

/** Тіл аудармасы bundle-ын алдын ала дайындау. */
export function prefetchQuranAyahSearch(locale: AppLocale = "kk"): Promise<void> {
  if (locale === "kk") {
    return ensureQuranKkSearchIndex().catch(() => {});
  }
  if (locale === "ar") return Promise.resolve();
  if (isQuranTranslationLocale(locale)) return prefetchBundledQuranTranslations();
  return prefetchQuranKkSearchIndex();
}

async function fetchApiSearchHits(
  token: string,
  limit: number,
  locale: AppLocale,
  timeoutMs: number
): Promise<QuranAyahSearchHit[]> {
  const base = getRaqatApiBase();
  if (!base) return [];

  const bearer = ((await getValidAccessToken()) ?? "").trim() || undefined;
  const res = await fetchPlatformQuranSearch(base, token, {
    lang: quranSearchLangForLocale(locale),
    limit: Math.min(limit, 50),
    includeTranslit: true,
    timeoutMs,
    contentSecret: getRaqatContentReadSecret(),
    authorizationBearer: bearer,
  });
  if (!res.ok || !res.items?.length) return [];
  return res.items
    .map((row) => mapPlatformHit(row, locale))
    .filter((row): row is QuranAyahSearchHit => row != null);
}

/** Офлайн аударма — негізгі; API қысқа уақытта қосымша нәтиже береді. */
export async function searchQuranAyahs(
  query: string,
  opts?: { limit?: number; timeoutMs?: number; locale?: AppLocale }
): Promise<QuranAyahSearchHit[]> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 80, 200));
  const locale = opts?.locale ?? "kk";
  const token = query.trim();
  if (token.length < 2) return [];

  const localHits = await searchQuranAyahsLocal(token, limit, locale);
  const base = getRaqatApiBase();
  if (!base) return localHits;

  const apiTimeoutMs = Math.max(400, Math.min(opts?.timeoutMs ?? 1_200, 4_000));
  try {
    const apiHits = await fetchApiSearchHits(token, limit, locale, apiTimeoutMs);
    if (apiHits.length) return mergeSearchHits(localHits, apiHits, limit);
  } catch {
    /* офлайн нәтиже */
  }

  return localHits;
}
