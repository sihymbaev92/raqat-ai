import { searchBundledKkAyahs } from "../services/bundledQuranReader";
import { loadBundledJson } from "../utils/loadBundledJson";

type KkDbBundle = {
  data?: {
    surahs?: Array<{
      number: number;
      ayahs?: Array<{ numberInSurah: number; text_kk?: string; translit?: string }>;
    }>;
  };
};

let resolvedBundle: KkDbBundle | null = null;
let loadPromise: Promise<void> | null = null;

function normalizeSearchToken(query: string): string {
  return query.toLowerCase().normalize("NFKC").trim();
}

function searchInBundle(
  bundle: KkDbBundle,
  token: string,
  limit: number
): Array<{ surah: number; ayah: number; meaning: string }> {
  const needle = normalizeSearchToken(token);
  if (needle.length < 2) return [];

  const cap = Math.max(1, Math.min(limit, 120));
  const hits: Array<{ surah: number; ayah: number; meaning: string }> = [];

  for (const surah of bundle.data?.surahs ?? []) {
    const surahNumber = surah.number;
    if (!Number.isFinite(surahNumber)) continue;
    for (const ayah of surah.ayahs ?? []) {
      const ayahNumber = ayah.numberInSurah;
      const text = (ayah.text_kk ?? "").trim();
      if (!Number.isFinite(ayahNumber) || !text) continue;
      if (!text.toLowerCase().normalize("NFKC").includes(needle)) continue;
      hits.push({ surah: surahNumber, ayah: ayahNumber, meaning: text });
      if (hits.length >= cap) return hits;
    }
  }

  return hits;
}

async function resolveKkSearchBundle(): Promise<KkDbBundle> {
  const loaded = await loadBundledJson<KkDbBundle>("quran-kk-from-db.json");
  if ((loaded.data?.surahs?.length ?? 0) > 0) return loaded;
  throw new Error("quran-kk-from-db unavailable");
}

export function isQuranKkSearchIndexReady(): boolean {
  return (resolvedBundle?.data?.surahs?.length ?? 0) > 0;
}

/** quran-kk-from-db.json — офлайн қазақша аударма іздеу. */
export async function ensureQuranKkSearchIndex(): Promise<void> {
  if (isQuranKkSearchIndexReady()) return;
  if (!loadPromise) {
    loadPromise = resolveKkSearchBundle()
      .then((bundle) => {
        resolvedBundle = bundle;
      })
      .catch((err) => {
        loadPromise = null;
        resolvedBundle = null;
        throw err;
      });
  }
  await loadPromise;
}

export function prefetchQuranKkSearchIndex(): Promise<void> {
  return ensureQuranKkSearchIndex().catch(() => {});
}

export async function searchQuranKkIndex(
  query: string,
  limit = 60
): Promise<Array<{ surah: number; ayah: number; meaning: string }>> {
  const token = normalizeSearchToken(query);
  if (token.length < 2) return [];

  const cap = Math.max(1, Math.min(limit, 120));

  const readerHits = searchBundledKkAyahs(token, cap);
  if (readerHits.length >= cap) return readerHits;

  await ensureQuranKkSearchIndex();
  const bundleHits = searchInBundle(resolvedBundle!, token, cap);

  if (!readerHits.length) return bundleHits;
  if (!bundleHits.length) return readerHits;

  const seen = new Set<string>();
  const merged: Array<{ surah: number; ayah: number; meaning: string }> = [];
  for (const row of [...readerHits, ...bundleHits]) {
    const key = `${row.surah}:${row.ayah}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(row);
    if (merged.length >= cap) break;
  }
  return merged;
}

/** Тест/жад: индексті қайта құру. */
export function resetQuranKkSearchIndexForTests(): void {
  resolvedBundle = null;
  loadPromise = null;
}
