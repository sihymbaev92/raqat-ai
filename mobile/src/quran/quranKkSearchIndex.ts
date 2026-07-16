import { loadBundledJson } from "../utils/loadBundledJson";
import {
  collectBundledKkSearchRows,
  ensureBundledQuranReaderLoaded,
  isBundledKkReaderReady,
} from "../services/bundledQuranReader";

type KkDbBundle = {
  data?: {
    surahs?: Array<{
      number: number;
      ayahs?: Array<{ numberInSurah: number; text_kk?: string; translit?: string }>;
    }>;
  };
};

type AyahSearchRecord = {
  surah: number;
  ayah: number;
  meaning: string;
  haystack: string;
  meaningNorm: string;
};

let searchRecords: AyahSearchRecord[] | null = null;
let indexPromise: Promise<void> | null = null;

export function normalizeKkSearchText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[ʻʼ''`]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeKkSearchQuery(query: string): string[] {
  const normalized = normalizeKkSearchText(query);
  if (!normalized) return [];
  const tokens = normalized.split(/[\s,;.!?]+/).filter((t) => t.length >= 2);
  if (tokens.length > 0) return tokens;
  return normalized.length >= 2 ? [normalized] : [];
}

function escapeRegexToken(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesHaystack(haystack: string, tokens: string[]): boolean {
  return tokens.every((token) => haystack.includes(token));
}

function scoreHaystackMatch(meaningNorm: string, haystack: string, tokens: string[]): number {
  let score = 0;
  for (const token of tokens) {
    if (meaningNorm.includes(token)) {
      score += 24;
      if (new RegExp(`(?:^|\\s)${escapeRegexToken(token)}`).test(meaningNorm)) score += 8;
    } else if (haystack.includes(token)) {
      score += 10;
    }
  }
  return score;
}

async function resolveKkSearchBundle(): Promise<KkDbBundle> {
  const loaded = await loadBundledJson<KkDbBundle>("quran-kk-from-db.json");
  if ((loaded.data?.surahs?.length ?? 0) > 0) return loaded;
  throw new Error("quran-kk-from-db unavailable");
}

function buildRecordsFromKkSurahs(
  surahs: Array<{
    number: number;
    ayahs?: Array<{ numberInSurah: number; text_kk?: string; translit?: string }>;
  }>
): AyahSearchRecord[] {
  const records: AyahSearchRecord[] = [];
  for (const surah of surahs) {
    const surahNumber = surah.number;
    if (!Number.isFinite(surahNumber)) continue;
    for (const ayah of surah.ayahs ?? []) {
      const ayahNumber = ayah.numberInSurah;
      const meaning = (ayah.text_kk ?? "").trim();
      if (!Number.isFinite(ayahNumber) || !meaning) continue;
      const translit = (ayah.translit ?? "").trim();
      const meaningNorm = normalizeKkSearchText(meaning);
      const haystack = normalizeKkSearchText([meaning, translit].filter(Boolean).join(" "));
      records.push({ surah: surahNumber, ayah: ayahNumber, meaning, haystack, meaningNorm });
    }
  }
  return records;
}

async function buildRecordsFromKkBundleAsync(bundle: KkDbBundle): Promise<AyahSearchRecord[]> {
  const records: AyahSearchRecord[] = [];
  let surahCount = 0;
  for (const surah of bundle.data?.surahs ?? []) {
    records.push(...buildRecordsFromKkSurahs([surah]));
    surahCount += 1;
    if (surahCount % 12 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  return records;
}

async function buildSearchIndexAsync(): Promise<void> {
  if (searchRecords?.length) return;

  /** Алдымен жеңіл kk-db bundle — reader-ге тәуелді емес (фонда жад босатылғанда да тұрақты). */
  try {
    const bundle = await resolveKkSearchBundle();
    const fromBundle = await buildRecordsFromKkBundleAsync(bundle);
    if (fromBundle.length) {
      searchRecords = fromBundle;
      return;
    }
  } catch {
    /* reader fallback */
  }

  if (process.env.NODE_ENV !== "test") {
    try {
      await ensureBundledQuranReaderLoaded();
      if (isBundledKkReaderReady()) {
        const records: AyahSearchRecord[] = [];
        for (const row of collectBundledKkSearchRows()) {
          const meaningNorm = normalizeKkSearchText(row.meaning);
          const haystack = normalizeKkSearchText([row.meaning, row.translit].filter(Boolean).join(" "));
          records.push({
            surah: row.surah,
            ayah: row.ayah,
            meaning: row.meaning,
            haystack,
            meaningNorm,
          });
        }
        if (records.length) {
          searchRecords = records;
          return;
        }
      }
    } catch {
      /* kk-db қайтадан */
    }
  }

  const bundle = await resolveKkSearchBundle();
  searchRecords = await buildRecordsFromKkBundleAsync(bundle);
}

export function isQuranKkSearchIndexReady(): boolean {
  return (searchRecords?.length ?? 0) > 0;
}

/** quran-kk-from-db.json — офлайн қазақша аударма + транскрипция іздеу индексі. */
export async function ensureQuranKkSearchIndex(): Promise<void> {
  if (isQuranKkSearchIndexReady()) return;
  if (!indexPromise) {
    indexPromise = buildSearchIndexAsync().catch(() => {
      indexPromise = null;
    });
  }
  await indexPromise;
}

export function prefetchQuranKkSearchIndex(): Promise<void> {
  return ensureQuranKkSearchIndex().catch(() => {});
}

export async function searchQuranKkIndex(
  query: string,
  limit = 80
): Promise<Array<{ surah: number; ayah: number; meaning: string }>> {
  const tokens = tokenizeKkSearchQuery(query);
  if (!tokens.length) return [];

  await ensureQuranKkSearchIndex().catch(() => {});
  const records = searchRecords;
  if (!records?.length) return [];

  const cap = Math.max(1, Math.min(limit, 200));
  const scored: Array<{ record: AyahSearchRecord; score: number }> = [];

  for (const record of records) {
    if (!matchesHaystack(record.haystack, tokens)) continue;
    scored.push({
      record,
      score: scoreHaystackMatch(record.meaningNorm, record.haystack, tokens),
    });
  }

  scored.sort((a, b) => b.score - a.score || a.record.surah - b.record.surah || a.record.ayah - b.record.ayah);

  return scored.slice(0, cap).map((row) => ({
    surah: row.record.surah,
    ayah: row.record.ayah,
    meaning: row.record.meaning,
  }));
}

/** Тест/жад: индексті қайта құру. */
export function resetQuranKkSearchIndexForTests(): void {
  searchRecords = null;
  indexPromise = null;
}

export function releaseQuranKkSearchIndexMemory(): void {
  searchRecords = null;
  indexPromise = null;
}
