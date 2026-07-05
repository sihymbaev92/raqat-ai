import type { AppLocale } from "../i18n/runtime";
import {
  prefetchBundledQuranTranslations,
  searchBundledQuranTranslations,
} from "../services/quranOfflineTranslations";
import {
  isQuranTranslationLocale,
  type QuranTranslationLocale,
} from "../services/quranTranslationEditions";
import { searchBundledArabicAyahs } from "../services/bundledQuranReader";
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

function mapPlatformHit(row: PlatformQuranSearchItem): QuranAyahSearchHit | null {
  const surah = row.surah;
  const ayah = row.ayah;
  if (typeof surah !== "number" || typeof ayah !== "number") return null;
  const meaning = (row.text_tr ?? row.translit ?? row.text_ar ?? "").toString().trim();
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

/** Офлайн іздеу — app locale бойынша сәйкес аударма дерегінен. */
export async function searchQuranAyahsLocal(
  query: string,
  limit = 40,
  locale: AppLocale = "kk"
): Promise<QuranAyahSearchHit[]> {
  if (locale === "kk") {
    return searchQuranKkIndex(query, limit);
  }
  if (locale === "ar") {
    return searchBundledArabicAyahs(query, limit);
  }
  if (isQuranTranslationLocale(locale)) {
    return searchBundledQuranTranslations(query, locale as QuranTranslationLocale, limit);
  }
  return searchQuranKkIndex(query, limit);
}

/** Тіл аудармасы bundle-ын алдын ала дайындау. */
export function prefetchQuranAyahSearch(locale: AppLocale = "kk"): Promise<void> {
  if (locale === "kk") return prefetchQuranKkSearchIndex();
  if (locale === "ar") return Promise.resolve();
  if (isQuranTranslationLocale(locale)) return prefetchBundledQuranTranslations();
  return prefetchQuranKkSearchIndex();
}

/** Офлайн аударма — негізгі; API қосымша нәтиже береді. */
export async function searchQuranAyahs(
  query: string,
  opts?: { limit?: number; timeoutMs?: number; locale?: AppLocale }
): Promise<QuranAyahSearchHit[]> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 60, 120));
  const locale = opts?.locale ?? "kk";
  const token = query.trim();
  if (token.length < 2) return [];

  const localHits = await searchQuranAyahsLocal(token, limit, locale);

  const base = getRaqatApiBase();
  if (!base) return localHits;

  try {
    const bearer = ((await getValidAccessToken()) ?? "").trim() || undefined;
    const res = await fetchPlatformQuranSearch(base, token, {
      limit: Math.min(limit, 50),
      lang: quranSearchLangForLocale(locale),
      includeTranslit: true,
      timeoutMs: opts?.timeoutMs ?? 8_000,
      contentSecret: getRaqatContentReadSecret(),
      authorizationBearer: bearer,
    });
    if (res.ok && res.items?.length) {
      const apiHits = res.items
        .map(mapPlatformHit)
        .filter((row): row is QuranAyahSearchHit => row != null);
      if (apiHits.length) return mergeSearchHits(localHits, apiHits, limit);
    }
  } catch {
    /* офлайн нәтиже */
  }

  return localHits;
}
