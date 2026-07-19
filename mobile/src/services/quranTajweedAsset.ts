/**
 * Offline quran-tajweed — cache → APK seed → CDN.
 * Slim APK-да `assets/quran_tajweed.json` жоқ; `quran-tajweed-offline.json` қалады.
 */
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import type { CachedAyah } from "../storage/quranSurahCache";
import { getQuranTajweedAssetUrl } from "../config/quranTajweedAssetBase";
import { ALQURAN_TAJWEED_API_URL } from "../config/bundledJsonFallbacks";
import { quranTajweedDocFromAlquranApi } from "./quranTajweedFromAlquran";
import { stripTajweedTags } from "../utils/alquranTajweedParse";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import { tryLoadBundledJson } from "../utils/loadBundledJson";

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

const CACHE_PATH = `${documentDirectory ?? ""}quran-tajweed-asset.json`;

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

function loadFromBundledAssetModule(): unknown {
  // Slim APK stash-тайды — Metro статикалық require жасамасын.
  const dynRequire = eval("require") as (path: string) => unknown;
  return dynRequire("../../assets/quran_tajweed.json");
}

function tryParseBundledFullAsset(): QuranTajweedAssetDoc | null {
  if (process.env.NODE_ENV === "production") return null;
  try {
    return parseDoc(loadFromBundledAssetModule());
  } catch {
    return null;
  }
}

type OfflineTajweedSeed = {
  version?: number;
  source?: string;
  generatedAt?: string;
  surahs?: Record<string, Record<string, string>>;
};

type SurahListApiRow = {
  number: number;
  name?: string;
  englishName?: string;
  englishNameTranslation?: string;
  revelationType?: string;
  numberOfAyahs?: number;
};

/** Slim APK офлайн seed → толық QuranTajweedAssetDoc (114 сүре тізімі + тегтер). */
async function buildDocFromOfflineSeed(): Promise<QuranTajweedAssetDoc | null> {
  const seed = await tryLoadBundledJson<OfflineTajweedSeed>("quran-tajweed-offline.json");
  if (!seed?.surahs || !Object.keys(seed.surahs).length) return null;

  const listRaw = await tryLoadBundledJson<{ data?: SurahListApiRow[] }>("surah-list-api.json");
  const metaByNum = new Map<number, SurahListApiRow>();
  for (const row of listRaw?.data ?? []) {
    if (typeof row?.number === "number") metaByNum.set(row.number, row);
  }

  const surahs: QuranTajweedSurah[] = [];
  let taggedAyahCount = 0;
  for (let n = 1; n <= 114; n++) {
    const ayahMap = seed.surahs[String(n)] ?? {};
    const meta = metaByNum.get(n);
    const ayahs: QuranTajweedAyah[] = Object.entries(ayahMap)
      .map(([k, text]) => {
        const numberInSurah = Number(k);
        const tagged = (text ?? "").trim();
        if (!Number.isFinite(numberInSurah) || !tagged) return null;
        if (tagged.includes("[")) taggedAyahCount += 1;
        return { number: numberInSurah, numberInSurah, text: tagged } as QuranTajweedAyah;
      })
      .filter((a): a is QuranTajweedAyah => a != null)
      .sort((a, b) => a.numberInSurah - b.numberInSurah);

    surahs.push({
      number: n,
      name: meta?.name,
      englishName: meta?.englishName,
      englishNameTranslation: meta?.englishNameTranslation,
      revelationType: meta?.revelationType,
      numberOfAyahs: meta?.numberOfAyahs ?? ayahs.length,
      ayahs,
    });
  }

  if (!surahs.some((s) => s.ayahs.length > 0)) return null;

  return {
    version: typeof seed.version === "number" ? seed.version : 1,
    source: seed.source ?? "quran-tajweed-offline.json",
    generatedAt: seed.generatedAt,
    surahCount: surahs.length,
    ayahCount: surahs.reduce((n, s) => n + s.ayahs.length, 0),
    taggedAyahCount,
    surahs,
  };
}

async function readCachedDocRaw(): Promise<string | null> {
  if (!documentDirectory) return null;
  const info = await getInfoAsync(CACHE_PATH);
  if (!info.exists || !info.size) return null;
  try {
    return await readAsStringAsync(CACHE_PATH);
  } catch {
    return null;
  }
}

async function writeCachedDocRaw(raw: string): Promise<void> {
  if (!documentDirectory) return;
  const dir = documentDirectory;
  const dirInfo = await getInfoAsync(dir);
  if (!dirInfo.exists) {
    await makeDirectoryAsync(dir, { intermediates: true });
  }
  await writeAsStringAsync(CACHE_PATH, raw);
}

async function fetchRemoteDoc(): Promise<QuranTajweedAssetDoc> {
  const urls = [ALQURAN_TAJWEED_API_URL, getQuranTajweedAssetUrl()];
  let lastErr = "no url";
  for (const url of urls) {
    try {
      const r = await fetchWithTimeout(url, { timeoutMs: 120_000 });
      if (!r.ok) {
        lastErr = `HTTP ${r.status}`;
        continue;
      }
      const body = (await r.json()) as unknown;
      const parsed =
        url === ALQURAN_TAJWEED_API_URL
          ? quranTajweedDocFromAlquranApi(body)
          : parseDoc(body);
      const raw = JSON.stringify(parsed);
      await writeCachedDocRaw(raw);
      return parsed;
    } catch (err) {
      lastErr = String(err);
    }
  }
  throw new Error(`quran_tajweed: ${lastErr}`);
}

async function resolveDoc(): Promise<QuranTajweedAssetDoc> {
  if (process.env.NODE_ENV === "test") {
    return parseDoc(loadFromBundledAssetModule());
  }

  const cachedRaw = await readCachedDocRaw();
  if (cachedRaw) {
    try {
      return parseDoc(JSON.parse(cachedRaw) as unknown);
    } catch {
      /* fall through */
    }
  }

  const fromFullAsset = tryParseBundledFullAsset();
  if (fromFullAsset) return fromFullAsset;

  const fromSeed = await buildDocFromOfflineSeed();
  if (fromSeed) {
    try {
      await writeCachedDocRaw(JSON.stringify(fromSeed));
    } catch {
      /* cache optional */
    }
    return fromSeed;
  }

  return fetchRemoteDoc();
}

export async function ensureQuranTajweedAssetLoaded(): Promise<void> {
  if (doc) return;
  if (!loadPromise) {
    loadPromise = Promise.resolve()
      .then(async () => {
        doc = await resolveDoc();
        surahMap = buildSurahMap(doc.surahs);
      })
      .finally(() => {
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

/** Хатым/тәжуид экранынан шыққанда parsed doc + map босату. */
export function releaseQuranTajweedAssetMemory(): void {
  if (process.env.NODE_ENV === "test") return;
  doc = null;
  surahMap = null;
  loadPromise = null;
}
