/**
 * Offline quran-tajweed — `assets/quran_tajweed.json` (Flutter rootBundle эквиваленті).
 */
import type { CachedAyah } from "../storage/quranSurahCache";
import { stripTajweedTags } from "../utils/alquranTajweedParse";

export type QuranTajweedAyah = {
  number: number;
  numberInSurah: number;
  text: string;
  juz?: number;
  manzil?: number;
  page?: number;
  ruku?: number;
  hizbQuarter?: number;
  sajda?: boolean | { id?: number; recommended?: boolean; obligatory?: boolean };
};

export type QuranTajweedSurah = {
  number: number;
  name?: string;
  englishName?: string;
  englishNameTranslation?: string;
  revelationType?: string;
  numberOfAyahs?: number;
  ayahs: QuranTajweedAyah[];
};

export type QuranTajweedAssetDoc = {
  version?: number;
  source?: string;
  generatedAt?: string;
  surahCount?: number;
  ayahCount?: number;
  taggedAyahCount?: number;
  surahs: QuranTajweedSurah[];
};

type SurahMap = Record<string, Record<string, string>>;

let doc: QuranTajweedAssetDoc | null = null;
let surahMap: SurahMap | null = null;
let loadPromise: Promise<void> | null = null;

function parseDoc(raw: unknown): QuranTajweedAssetDoc {
  const body = raw as Record<string, unknown>;
  const surahs = Array.isArray(body.surahs)
    ? (body.surahs as QuranTajweedSurah[])
    : Array.isArray((body.data as Record<string, unknown> | undefined)?.surahs)
      ? ((body.data as { surahs: QuranTajweedSurah[] }).surahs ?? [])
      : [];
  if (!surahs.length) {
    throw new Error("quran_tajweed.json: surahs[] missing");
  }
  return {
    version: typeof body.version === "number" ? body.version : 1,
    source: typeof body.source === "string" ? body.source : undefined,
    generatedAt: typeof body.generatedAt === "string" ? body.generatedAt : undefined,
    surahCount: typeof body.surahCount === "number" ? body.surahCount : surahs.length,
    ayahCount: typeof body.ayahCount === "number" ? body.ayahCount : undefined,
    taggedAyahCount: typeof body.taggedAyahCount === "number" ? body.taggedAyahCount : undefined,
    surahs,
  };
}

function buildSurahMap(surahs: QuranTajweedSurah[]): SurahMap {
  const out: SurahMap = {};
  for (const surah of surahs) {
    const n = surah.number;
    if (typeof n !== "number" || n < 1 || n > 114) continue;
    const ayahMap: Record<string, string> = {};
    for (const ayah of surah.ayahs ?? []) {
      const text = (ayah.text ?? "").trim();
      if (text.includes("[") && typeof ayah.numberInSurah === "number") {
        ayahMap[String(ayah.numberInSurah)] = text;
      }
    }
    if (Object.keys(ayahMap).length) out[String(n)] = ayahMap;
  }
  return out;
}

/** Metro/APK asset — Flutter `rootBundle.loadString('assets/quran_tajweed.json')`. */
function loadAssetModule(): unknown {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("../../assets/quran_tajweed.json");
}

export async function ensureQuranTajweedAssetLoaded(): Promise<void> {
  if (doc) return;
  if (!loadPromise) {
    loadPromise = Promise.resolve().then(() => {
      doc = parseDoc(loadAssetModule());
      surahMap = buildSurahMap(doc.surahs);
    }).finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export function isQuranTajweedAssetLoaded(): boolean {
  return Boolean(doc?.surahs?.length);
}

export function getQuranTajweedSurahs(): QuranTajweedSurah[] {
  return doc?.surahs ?? [];
}

export function getQuranTajweedSurah(surah: number): QuranTajweedSurah | null {
  return doc?.surahs.find((s) => s.number === surah) ?? null;
}

export function getQuranTajweedSurahAyahMap(surah: number): Record<number, string> | null {
  const raw = surahMap?.[String(surah)];
  if (!raw) return null;
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(k);
    const text = (v ?? "").trim();
    if (Number.isFinite(n) && text.includes("[")) out[n] = text;
  }
  return Object.keys(out).length ? out : null;
}

export function quranTajweedSurahToCachedAyahs(surah: number): CachedAyah[] {
  const meta = getQuranTajweedSurah(surah);
  if (!meta) return [];
  return (meta.ayahs ?? []).map((ayah) => {
    const textTajweed = (ayah.text ?? "").trim();
    const plain = textTajweed.includes("[") ? stripTajweedTags(textTajweed) : textTajweed;
    return {
      numberInSurah: ayah.numberInSurah,
      text: plain,
      ...(textTajweed.includes("[") ? { textTajweed } : {}),
    };
  });
}

export async function loadQuranTajweedSurahAyahMap(surah: number): Promise<Record<number, string> | null> {
  await ensureQuranTajweedAssetLoaded();
  return getQuranTajweedSurahAyahMap(surah);
}

export async function loadQuranTajweedCachedAyahs(surah: number): Promise<CachedAyah[]> {
  await ensureQuranTajweedAssetLoaded();
  return quranTajweedSurahToCachedAyahs(surah);
}

/** Хатым/тәжуид экранынан шыққанда parsed doc + map босату (require модулі қалуы мүмкін). */
export function releaseQuranTajweedAssetMemory(): void {
  if (process.env.NODE_ENV === "test") return;
  doc = null;
  surahMap = null;
  loadPromise = null;
}
