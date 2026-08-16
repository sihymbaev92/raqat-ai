/**
 * Құранның ауыр JSON деректері — runtime CDN + FileSystem кэш (Metro бандлда емес).
 */
import { Platform } from "react-native";
import type { CachedAyah } from "../storage/quranSurahCache";
import { parseSurahsFromApiJson } from "../storage/quranListCache";
import { hasCyrillicScript } from "../utils/quranTranslitDisplay";
import {
  ensureBundledSurahListLoaded,
  releaseBundledSurahListMemory,
  setBundledSurahList,
} from "./bundledQuranSurahList";
import {
  loadBundledJson,
  releaseBundledJsonMemory,
  tryLoadBundledJson,
  invalidateBundledJsonCache,
} from "../utils/loadBundledJson";

type SurahBundle = {
  number: number;
  ayahs: Array<{ numberInSurah: number; text: string }>;
};

type KkAyah = { numberInSurah: number; text_kk: string; translit?: string };

let ayahsBySurah: Map<number, CachedAyah[]> | null = null;
let kkBySurah: Map<number, Map<number, string>> | null = null;
let bookTranslitBySurah: Map<number, Map<number, string>> | null = null;
let loadPromise: Promise<void> | null = null;
let kkLoadPromise: Promise<void> | null = null;

type KkDbBundle = { data?: { surahs?: Array<{ number: number; ayahs: KkAyah[] }> } };

function buildKkMapsFromDbBundle(kkFromDbBundle: KkDbBundle): void {
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
}

function buildTurkishPrintBySurah(
  unicodeBundle: { data?: { surahs?: SurahBundle[] } } | null | undefined
): Map<number, Map<number, string>> {
  const out = new Map<number, Map<number, string>>();
  for (const s of unicodeBundle?.data?.surahs ?? []) {
    const m = new Map<number, string>();
    for (const a of s.ayahs ?? []) {
      const t = (a.text ?? "").trim();
      if (t) m.set(a.numberInSurah, t);
    }
    if (m.size) out.set(s.number, m);
  }
  return out;
}

function buildMapsFromBundles(
  surahListBundle: unknown,
  fullQuranBundle: { data?: { surahs?: SurahBundle[] } },
  _translitBundle: { data?: { surahs?: SurahBundle[] } },
  kkFromDbBundle: KkDbBundle | null,
  unicodeQuranBundle?: { data?: { surahs?: SurahBundle[] } } | null
): void {
  buildMapsFromBundlesSync(
    surahListBundle,
    fullQuranBundle,
    _translitBundle,
    kkFromDbBundle,
    unicodeQuranBundle
  );
}

function buildMapsFromBundlesSync(
  surahListBundle: unknown,
  fullQuranBundle: { data?: { surahs?: SurahBundle[] } },
  _translitBundle: { data?: { surahs?: SurahBundle[] } },
  kkFromDbBundle: KkDbBundle | null,
  unicodeQuranBundle?: { data?: { surahs?: SurahBundle[] } } | null
): void {
  if (surahListBundle != null) {
    const parsed = parseSurahsFromApiJson(surahListBundle);
    if (parsed?.length) setBundledSurahList(parsed);
  }

  if (kkFromDbBundle) {
    buildKkMapsFromDbBundle(kkFromDbBundle);
  }
  if (!kkBySurah) kkBySurah = new Map();
  if (!bookTranslitBySurah) bookTranslitBySurah = new Map();

  const turkishBySurah = buildTurkishPrintBySurah(unicodeQuranBundle);
  ayahsBySurah = new Map();
  for (const s of fullQuranBundle?.data?.surahs ?? []) {
    const kkMap = kkBySurah.get(s.number);
    const dbTrMap = bookTranslitBySurah.get(s.number);
    const turkishMap = turkishBySurah.get(s.number);
    const ayahs: CachedAyah[] = (s.ayahs ?? []).map((a) => {
      const trDb = dbTrMap?.get(a.numberInSurah);
      const trDbStr = (trDb ?? "").trim();
      // Тек кирилл (кітаптық) — латын EN-ді сақтамаймыз; экран арабтан KK генерациялайды.
      const tr = trDbStr && hasCyrillicScript(trDbStr) ? trDbStr : "";
      const kkTxt = kkMap?.get(a.numberInSurah);
      const textTurkishPrint = turkishMap?.get(a.numberInSurah);
      return {
        numberInSurah: a.numberInSurah,
        text: a.text,
        ...(tr ? { translit: tr } : {}),
        ...(kkTxt ? { textKk: kkTxt } : {}),
        ...(textTurkishPrint ? { textTurkishPrint } : {}),
      };
    });
    if (ayahs.length) ayahsBySurah.set(s.number, ayahs);
  }
}

async function buildMapsFromBundlesAsync(
  surahListBundle: unknown,
  fullQuranBundle: { data?: { surahs?: SurahBundle[] } },
  translitBundle: { data?: { surahs?: SurahBundle[] } },
  kkFromDbBundle: KkDbBundle | null,
  unicodeQuranBundle?: { data?: { surahs?: SurahBundle[] } } | null
): Promise<void> {
  if (surahListBundle != null) {
    const parsed = parseSurahsFromApiJson(surahListBundle);
    if (parsed?.length) setBundledSurahList(parsed);
  }

  if (kkFromDbBundle) {
    buildKkMapsFromDbBundle(kkFromDbBundle);
  }
  if (!kkBySurah) kkBySurah = new Map();
  if (!bookTranslitBySurah) bookTranslitBySurah = new Map();

  const turkishBySurah = buildTurkishPrintBySurah(unicodeQuranBundle);
  ayahsBySurah = new Map();
  const surahs = fullQuranBundle?.data?.surahs ?? [];
  for (let i = 0; i < surahs.length; i += 1) {
    const s = surahs[i]!;
    const kkMap = kkBySurah.get(s.number);
    const dbTrMap = bookTranslitBySurah.get(s.number);
    const turkishMap = turkishBySurah.get(s.number);
    const ayahs: CachedAyah[] = (s.ayahs ?? []).map((a) => {
      const trDb = dbTrMap?.get(a.numberInSurah);
      const trDbStr = (trDb ?? "").trim();
      const tr = trDbStr && hasCyrillicScript(trDbStr) ? trDbStr : "";
      const kkTxt = kkMap?.get(a.numberInSurah);
      const textTurkishPrint = turkishMap?.get(a.numberInSurah);
      return {
        numberInSurah: a.numberInSurah,
        text: a.text,
        ...(tr ? { translit: tr } : {}),
        ...(kkTxt ? { textKk: kkTxt } : {}),
        ...(textTurkishPrint ? { textTurkishPrint } : {}),
      };
    });
    if (ayahs.length) ayahsBySurah.set(s.number, ayahs);
    if (i > 0 && i % 32 === 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
  void translitBundle;
}

function apkUsesBundledJsonLoader(): boolean {
  return Platform.OS !== "web" && process.env.NODE_ENV !== "test";
}

async function loadKkBundleAsync(): Promise<void> {
  if (kkBySurah && kkBySurah.size > 0) return;
  const kkFromDbBundle = await loadBundledJson<KkDbBundle>("quran-kk-from-db.json");
  buildKkMapsFromDbBundle(kkFromDbBundle);
  releaseBundledJsonMemory("quran-kk-from-db.json");
}

/** KK аударма/транскрипция — APK asset; uthmani CDN-ге тәуелді емес. */
export async function ensureBundledKkReaderLoaded(): Promise<void> {
  if (kkBySurah && kkBySurah.size > 0) return;
  if (!kkLoadPromise) {
    kkLoadPromise = loadKkBundleAsync().finally(() => {
      if (!kkBySurah?.size) kkLoadPromise = null;
    });
  }
  await kkLoadPromise;
}

async function loadUnicodeBundleWithRetry(): Promise<{ data?: { surahs?: SurahBundle[] } } | null> {
  let unicodeQuranBundle = await loadBundledJson<{ data?: { surahs?: SurahBundle[] } }>(
    "quran-unicode-full.json"
  ).catch(() => null);
  if (unicodeQuranBundle) return unicodeQuranBundle;
  await invalidateBundledJsonCache("quran-unicode-full.json");
  unicodeQuranBundle = await loadBundledJson<{ data?: { surahs?: SurahBundle[] } }>(
    "quran-unicode-full.json"
  ).catch(() => null);
  return unicodeQuranBundle;
}

function bundledTurkishPrintReady(): boolean {
  const row = ayahsBySurah?.get(1)?.[0];
  return Boolean((row?.textTurkishPrint ?? "").trim());
}

async function mergeUnicodeTurkishPrintIfNeeded(): Promise<void> {
  if (bundledTurkishPrintReady() || !ayahsBySurah?.size) return;
  const unicodeQuranBundle = await loadUnicodeBundleWithRetry();
  const turkishBySurah = buildTurkishPrintBySurah(unicodeQuranBundle);
  if (!turkishBySurah.size) return;
  for (const [surah, rows] of ayahsBySurah) {
    const turkishMap = turkishBySurah.get(surah);
    if (!turkishMap?.size) continue;
    ayahsBySurah.set(
      surah,
      rows.map((a) => {
        const t = turkishMap.get(a.numberInSurah);
        return t ? { ...a, textTurkishPrint: t } : a;
      })
    );
  }
  releaseBundledJsonMemory("quran-unicode-full.json");
}

async function loadBundlesAsync(): Promise<void> {
  const kkReady = Boolean(kkBySurah && kkBySurah.size > 0);
  if (ayahsBySurah && kkReady) {
    await mergeUnicodeTurkishPrintIfNeeded();
    return;
  }

  await ensureBundledKkReaderLoaded();

  const [fullQuranBundle, unicodeQuranBundle, translitBundle] = await Promise.all([
    loadBundledJson("quran-uthmani-full.json").catch(() => null),
    loadUnicodeBundleWithRetry(),
    tryLoadBundledJson("quran-en-transliteration-full.json"),
  ]);

  if (!fullQuranBundle) {
    if (!kkBySurah?.size) throw new Error("bundled quran load failed");
    return;
  }

  let surahListBundle: unknown = null;
  if (apkUsesBundledJsonLoader()) {
    await ensureBundledSurahListLoaded();
  } else {
    surahListBundle = await loadBundledJson("surah-list-api.json");
  }

  await buildMapsFromBundlesAsync(
    surahListBundle,
    fullQuranBundle as { data?: { surahs?: SurahBundle[] } },
    (translitBundle ?? { data: { surahs: [] } }) as { data?: { surahs?: SurahBundle[] } },
    null,
    unicodeQuranBundle as { data?: { surahs?: SurahBundle[] } } | null
  );
  releaseBundledJsonMemory("quran-uthmani-full.json");
  releaseBundledJsonMemory("quran-unicode-full.json");
  releaseBundledJsonMemory("quran-en-transliteration-full.json");
}

export { ensureBundledSurahListLoaded, getBundledSurahList } from "./bundledQuranSurahList";

/** Құран бандлдары жадқа түскенше күтеді. KK пакет кейін келсе — қайта біріктіреді. */
export async function ensureBundledQuranReaderLoaded(): Promise<void> {
  const kkReady = Boolean(kkBySurah && kkBySurah.size > 0);
  if (ayahsBySurah && kkReady) return;
  if (!loadPromise || (ayahsBySurah && !kkReady)) {
    loadPromise = loadBundlesAsync().finally(() => {
      /* keep resolved promise if maps ok; allow retry if KK still empty */
      if (!kkBySurah?.size) loadPromise = null;
    });
  }
  try {
    await loadPromise;
  } catch {
    loadPromise = null;
    await ensureBundledKkReaderLoaded().catch(() => {});
    if (kkBySurah?.size) return;
    throw new Error("bundled quran load failed");
  }
}

export function isBundledQuranReaderLoaded(): boolean {
  return ayahsBySurah != null;
}

/** Фонда немесе boot кезінде шақырылады. */
export function prefetchBundledQuranReader(): Promise<void> {
  return ensureBundledQuranReaderLoaded().catch(() => {});
}

/** Бір сүре аяттары (runtime кэш). */
export function getBundledSurahAyahs(surahNumber: number): CachedAyah[] | null {
  const rows = ayahsBySurah?.get(surahNumber);
  return rows?.length ? rows : null;
}

export function getBundledKkTextForAyah(surahNumber: number, ayahNumber: number): string | undefined {
  return kkBySurah?.get(surahNumber)?.get(ayahNumber)?.trim() || undefined;
}

/** Офлайн KK аударма іздеу (reader cache, quran-kk-from-db жүктелгенде). */
export function searchBundledKkAyahs(
  query: string,
  limit = 60
): Array<{ surah: number; ayah: number; meaning: string }> {
  const needle = query.toLowerCase().normalize("NFKC").trim();
  if (needle.length < 2 || !kkBySurah?.size) return [];

  const cap = Math.max(1, Math.min(limit, 120));
  const hits: Array<{ surah: number; ayah: number; meaning: string }> = [];

  for (const [surahNumber, ayahMap] of kkBySurah) {
    for (const [ayahNumber, text] of ayahMap) {
      const meaning = text.trim();
      if (!meaning) continue;
      if (!meaning.toLowerCase().normalize("NFKC").includes(needle)) continue;
      hits.push({ surah: surahNumber, ayah: ayahNumber, meaning });
      if (hits.length >= cap) return hits;
    }
  }

  return hits;
}

/** Офлайн араб мәтін бойынша іздеу (uthmani bundle жүктелгенде). */
export function searchBundledArabicAyahs(
  query: string,
  limit = 60
): Array<{ surah: number; ayah: number; meaning: string }> {
  const needle = query.trim();
  if (needle.length < 2 || !ayahsBySurah?.size) return [];

  const cap = Math.max(1, Math.min(limit, 120));
  const hits: Array<{ surah: number; ayah: number; meaning: string }> = [];

  for (const [surahNumber, rows] of ayahsBySurah) {
    for (const row of rows) {
      const text = (row.text ?? "").trim();
      if (!text || !text.includes(needle)) continue;
      hits.push({ surah: surahNumber, ayah: row.numberInSurah, meaning: text });
      if (hits.length >= cap) return hits;
    }
  }

  return hits;
}

export function getBundledBookTranslitForAyah(
  surahNumber: number,
  ayahNumber: number
): string | undefined {
  const tr = bookTranslitBySurah?.get(surahNumber)?.get(ayahNumber)?.trim();
  return tr && hasCyrillicScript(tr) ? tr : undefined;
}

export function isBundledKkReaderReady(): boolean {
  return Boolean(kkBySurah && kkBySurah.size > 0);
}

/** KK іздеу индексі — reader кэшінен (қосарлы JSON жүктемей). */
export function collectBundledKkSearchRows(): Array<{
  surah: number;
  ayah: number;
  meaning: string;
  translit: string;
}> {
  if (!kkBySurah?.size) return [];
  const rows: Array<{ surah: number; ayah: number; meaning: string; translit: string }> = [];
  for (const [surahNumber, ayahMap] of kkBySurah) {
    const trMap = bookTranslitBySurah?.get(surahNumber);
    for (const [ayahNumber, meaning] of ayahMap) {
      const text = meaning.trim();
      if (!text) continue;
      rows.push({
        surah: surahNumber,
        ayah: ayahNumber,
        meaning: text,
        translit: (trMap?.get(ayahNumber) ?? "").trim(),
      });
    }
  }
  return rows;
}

/**
 * Reader экрандарынан шыққанда толық аят map-тарын RAM-нан түсіреміз.
 * Сүре тізімін қалдыру nav/list ашылуын жылдам сақтайды, ал ең ауыр map-тар қайта қажет кезде құрылады.
 */
export function releaseBundledQuranReaderMemory(opts?: { keepSurahList?: boolean }): void {
  const keepSurahList = opts?.keepSurahList ?? true;
  if (!keepSurahList) {
    releaseBundledSurahListMemory();
  }
  ayahsBySurah = null;
  kkBySurah = null;
  bookTranslitBySurah = null;
  loadPromise = null;
  kkLoadPromise = null;
  releaseBundledJsonMemory("quran-uthmani-full.json");
  releaseBundledJsonMemory("quran-unicode-full.json");
  releaseBundledJsonMemory("quran-en-transliteration-full.json");
  releaseBundledJsonMemory("quran-kk-from-db.json");
}
