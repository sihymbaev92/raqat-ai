import type { AppLocale } from "../i18n/runtime";
import { getQuranTopicById, type QuranTopic } from "../content/quranTopicCatalog";
import {
  ensureBundledQuranReaderLoaded,
  getBundledKkTextForAyah,
} from "../services/bundledQuranReader";
import {
  getBundledQuranAyahTranslation,
  prefetchBundledQuranTranslations,
} from "../services/quranOfflineTranslations";
import { isQuranTranslationLocale } from "../services/quranTranslationEditions";
import { searchQuranAyahs, searchQuranAyahsLocal, type QuranAyahSearchHit } from "./searchQuranAyahs";

function hitKey(row: QuranAyahSearchHit): string {
  return `${row.surah}:${row.ayah}`;
}

function mergeHits(
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

async function meaningForAyah(
  surah: number,
  ayah: number,
  locale: AppLocale
): Promise<string> {
  if (locale === "kk" || locale === "ar") {
    await ensureBundledQuranReaderLoaded();
    return getBundledKkTextForAyah(surah, ayah) ?? "";
  }
  if (isQuranTranslationLocale(locale)) {
    await prefetchBundledQuranTranslations();
    return getBundledQuranAyahTranslation(surah, ayah, locale);
  }
  await ensureBundledQuranReaderLoaded();
  return getBundledKkTextForAyah(surah, ayah) ?? "";
}

/** Тақырып каталогындағы аяттарды офлайн мағынамен қайтарады. */
export async function resolveQuranTopicAyahs(
  topicId: string,
  locale: AppLocale = "kk"
): Promise<QuranAyahSearchHit[]> {
  const topic = getQuranTopicById(topicId);
  if (!topic) return [];

  const hits: QuranAyahSearchHit[] = [];
  for (const ref of topic.ayahs) {
    const meaning = (await meaningForAyah(ref.surah, ref.ayah, locale)).trim();
    if (!meaning) continue;
    hits.push({ surah: ref.surah, ayah: ref.ayah, meaning });
  }
  return hits;
}

/** Негізгі аяттар + кілт сөз бойынша қосымша іздеу. */
export async function searchQuranTopicAyahs(
  topic: QuranTopic,
  opts?: { limit?: number; locale?: AppLocale }
): Promise<QuranAyahSearchHit[]> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 80, 120));
  const locale = opts?.locale ?? "kk";
  const curated = await resolveQuranTopicAyahs(topic.id, locale);
  const keyword = topic.keywords[0]?.trim() ?? topic.titleKk.trim();
  if (keyword.length < 2) return curated;

  const extra = await searchQuranAyahs(keyword, { limit, locale, timeoutMs: 900 });
  return mergeHits(curated, extra, limit);
}

/** Тақырып id бойынша толық іздеу. */
export async function searchQuranTopicById(
  topicId: string,
  opts?: { limit?: number; locale?: AppLocale }
): Promise<QuranAyahSearchHit[]> {
  const topic = getQuranTopicById(topicId);
  if (!topic) return [];
  return searchQuranTopicAyahs(topic, opts);
}

/** Тесттер: кілт сөз бойынша локал іздеу (API жоқ). */
export async function searchQuranTopicAyahsLocalOnly(
  topic: QuranTopic,
  opts?: { limit?: number; locale?: AppLocale }
): Promise<QuranAyahSearchHit[]> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 80, 120));
  const locale = opts?.locale ?? "kk";
  const curated = await resolveQuranTopicAyahs(topic.id, locale);
  const keyword = topic.keywords[0]?.trim() ?? topic.titleKk.trim();
  if (keyword.length < 2) return curated;
  const extra = await searchQuranAyahsLocal(keyword, limit, locale);
  return mergeHits(curated, extra, limit);
}
