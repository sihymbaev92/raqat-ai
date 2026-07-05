/**
 * Құранның ауыр JSON деректері — runtime CDN + FileSystem кэш (Metro бандлда емес).
 */
import type { CachedAyah } from "../storage/quranSurahCache";
import type { CachedSurah } from "../storage/quranListCache";
import { parseSurahsFromApiJson } from "../storage/quranListCache";
import { hasCyrillicScript } from "../utils/quranTranslitDisplay";
import {
  loadBundledJson,
  releaseBundledJsonMemory,
  tryLoadBundledJson,
} from "../utils/loadBundledJson";

type SurahBundle = {
  number: number;
  ayahs: Array<{ numberInSurah: number; text: string }>;
};

type KkAyah = { numberInSurah: number; text_kk: string; translit?: string };

let listCache: CachedSurah[] | null = null;
let ayahsBySurah: Map<number, CachedAyah[]> | null = null;
let kkBySurah: Map<number, Map<number, string>> | null = null;
let bookTranslitBySurah: Map<number, Map<number, string>> | null = null;
let loadPromise: Promise<void> | null = null;
let surahListPromise: Promise<void> | null = null;

function buildMapsFromBundles(
  surahListBundle: unknown,
  fullQuranBundle: { data?: { surahs?: SurahBundle[] } },
  translitBundle: { data?: { surahs?: SurahBundle[] } },
  kkFromDbBundle: { data?: { surahs?: Array<{ number: number; ayahs: KkAyah[] }> } }
): void {
  listCache = parseSurahsFromApiJson(surahListBundle);

  const trBySurah = new Map<number, Map<number, string>>();
  for (const ts of translitBundle?.data?.surahs ?? []) {
    const m = new Map<number, string>();
    for (const a of ts.ayahs ?? []) m.set(a.numberInSurah, a.text);
    trBySurah.set(ts.number, m);
  }

  kkBySurah = new Map();
  bookTranslitBySurah = new Map();
  for (const ks of kkFromDbBundle?.data?.surahs ?? []) {
    const m = new Map<number, string>();
    const trm = new Map<number, string>();
    for (const a of ks.ayahs ?? []) {
      const t = (a.text_kk ?? "").trim();
      if (t) m.set(a.numberInSurah, t);
      const tr = (a.translit ?? "").trim();
      if (tr) trm.set(a.numberInSurah, tr);
    }
    if (m.size) kkBySurah.set(ks.number, m);
    if (trm.size) bookTranslitBySurah.set(ks.number, trm);
  }

  ayahsBySurah = new Map();
  for (const s of fullQuranBundle?.data?.surahs ?? []) {
    const trMap = trBySurah.get(s.number);
    const kkMap = kkBySurah.get(s.number);
    const dbTrMap = bookTranslitBySurah.get(s.number);
    const ayahs: CachedAyah[] = (s.ayahs ?? []).map((a) => {
      const trDb = dbTrMap?.get(a.numberInSurah);
      const trEn = (trMap?.get(a.numberInSurah) ?? "").trim();
      const trDbStr = (trDb ?? "").trim();
      const tr =
        (trDbStr && hasCyrillicScript(trDbStr) ? trDbStr : "") ||
        trEn ||
        (trDbStr && !hasCyrillicScript(trDbStr) ? trDbStr : "");
      const kkTxt = kkMap?.get(a.numberInSurah);
      return {
        numberInSurah: a.numberInSurah,
        text: a.text,
        ...(tr ? { translit: tr } : {}),
        ...(kkTxt ? { textKk: kkTxt } : {}),
      };
    });
    if (ayahs.length) ayahsBySurah.set(s.number, ayahs);
  }
}

async function loadBundlesAsync(): Promise<void> {
  if (ayahsBySurah) return;
  const [surahListBundle, fullQuranBundle, translitBundle, kkFromDbBundle] = await Promise.all([
    loadBundledJson("surah-list-api.json"),
    loadBundledJson("quran-uthmani-full.json"),
    tryLoadBundledJson("quran-en-transliteration-full.json"),
    tryLoadBundledJson("quran-kk-from-db.json"),
  ]);
  buildMapsFromBundles(
    surahListBundle,
    fullQuranBundle as { data?: { surahs?: SurahBundle[] } },
    (translitBundle ?? { data: { surahs: [] } }) as { data?: { surahs?: SurahBundle[] } },
    (kkFromDbBundle ?? { data: { surahs: [] } }) as {
      data?: { surahs?: Array<{ number: number; ayahs: KkAyah[] }> };
    }
  );
  releaseBundledJsonMemory("quran-uthmani-full.json");
  releaseBundledJsonMemory("quran-en-transliteration-full.json");
  releaseBundledJsonMemory("quran-kk-from-db.json");
}

async function loadSurahListOnlyAsync(): Promise<void> {
  if (listCache?.length) return;
  const surahListBundle = await loadBundledJson("surah-list-api.json");
  listCache = parseSurahsFromApiJson(surahListBundle);
}

/** Құран бандлдары жадқа түскенше күтеді. */
export async function ensureBundledQuranReaderLoaded(): Promise<void> {
  if (ayahsBySurah) return;
  if (!loadPromise) loadPromise = loadBundlesAsync();
  try {
    await loadPromise;
  } catch {
    loadPromise = null;
    throw new Error("bundled quran load failed");
  }
}

/** Тек сүрелер тізімі. Толық Құран JSON-дарын boot/list кезінде парстемейді. */
export async function ensureBundledSurahListLoaded(): Promise<void> {
  if (listCache?.length) return;
  if (!surahListPromise) surahListPromise = loadSurahListOnlyAsync();
  try {
    await surahListPromise;
  } catch {
    surahListPromise = null;
    throw new Error("bundled quran surah list load failed");
  }
}

export function isBundledQuranReaderLoaded(): boolean {
  return ayahsBySurah != null;
}

/** Фонда немесе boot кезінде шақырылады. */
export function prefetchBundledQuranReader(): Promise<void> {
  return ensureBundledQuranReaderLoaded().catch(() => {});
}

/** Сүрелер тізімі (runtime кэш). */
export function getBundledSurahList(): CachedSurah[] | null {
  return listCache?.length ? listCache : null;
}

/** Бір сүре аяттары (runtime кэш). */
export function getBundledSurahAyahs(surahNumber: number): CachedAyah[] | null {
  const rows = ayahsBySurah?.get(surahNumber);
  return rows?.length ? rows : null;
}

export function getBundledKkTextForAyah(surahNumber: number, ayahNumber: number): string | undefined {
  return kkBySurah?.get(surahNumber)?.get(ayahNumber)?.trim() || undefined;
}

export function getBundledBookTranslitForAyah(
  surahNumber: number,
  ayahNumber: number
): string | undefined {
  const tr = bookTranslitBySurah?.get(surahNumber)?.get(ayahNumber)?.trim();
  return tr && hasCyrillicScript(tr) ? tr : undefined;
}

/**
 * Reader экрандарынан шыққанда толық аят map-тарын RAM-нан түсіреміз.
 * Сүре тізімін қалдыру nav/list ашылуын жылдам сақтайды, ал ең ауыр map-тар қайта қажет кезде құрылады.
 */
export function releaseBundledQuranReaderMemory(opts?: { keepSurahList?: boolean }): void {
  const keepSurahList = opts?.keepSurahList ?? true;
  if (!keepSurahList) {
    listCache = null;
    surahListPromise = null;
    releaseBundledJsonMemory("surah-list-api.json");
  }
  ayahsBySurah = null;
  kkBySurah = null;
  bookTranslitBySurah = null;
  loadPromise = null;
  releaseBundledJsonMemory("quran-uthmani-full.json");
  releaseBundledJsonMemory("quran-en-transliteration-full.json");
  releaseBundledJsonMemory("quran-kk-from-db.json");
}
