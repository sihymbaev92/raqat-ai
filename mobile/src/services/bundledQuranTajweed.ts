import { releaseBundledJsonMemory, tryLoadBundledJson } from "../utils/loadBundledJson";

import {

  ensureQuranTajweedAssetLoaded,

  getQuranTajweedSurahAyahMap,

  isQuranTajweedAssetLoaded,

} from "./quranTajweedAsset";



type TajweedOfflineBundle = {

  version?: number;

  source?: string;

  generatedAt?: string;

  surahs?: Record<string, Record<string, string>>;

};



let legacyBundle: TajweedOfflineBundle | null = null;

let legacyLoadPromise: Promise<void> | null = null;



export function isBundledQuranTajweedLoaded(): boolean {

  return isQuranTajweedAssetLoaded() || (legacyBundle?.surahs != null && Object.keys(legacyBundle.surahs).length > 0);

}



export async function ensureBundledQuranTajweedLoaded(): Promise<void> {

  await ensureQuranTajweedAssetLoaded().catch(() => {});

  if (isQuranTajweedAssetLoaded()) return;



  if (legacyBundle) return;

  if (!legacyLoadPromise) {

    legacyLoadPromise = tryLoadBundledJson<TajweedOfflineBundle>("quran-tajweed-offline.json")

      .then((loaded) => {

        if (loaded) {

          legacyBundle = loaded;

          releaseBundledJsonMemory("quran-tajweed-offline.json");

        }

      })

      .finally(() => {

        legacyLoadPromise = null;

      });

  }

  return legacyLoadPromise;

}



function getLegacyAyahText(surah: number, ayahInSurah: number): string | null {

  const text = legacyBundle?.surahs?.[String(surah)]?.[String(ayahInSurah)]?.trim();

  return text?.includes("[") ? text : null;

}



function getLegacySurahMap(surah: number): Record<number, string> | null {

  const raw = legacyBundle?.surahs?.[String(surah)];

  if (!raw) return null;

  const out: Record<number, string> = {};

  for (const [k, v] of Object.entries(raw)) {

    const n = Number(k);

    const text = (v ?? "").trim();

    if (Number.isFinite(n) && text.includes("[")) out[n] = text;

  }

  return Object.keys(out).length ? out : null;

}



export function getBundledTajweedAyahText(surah: number, ayahInSurah: number): string | null {

  const fromAsset = getQuranTajweedSurahAyahMap(surah)?.[ayahInSurah];

  if (fromAsset) return fromAsset;

  return getLegacyAyahText(surah, ayahInSurah);

}



/** Сураның барлық аяттары: { ayahInSurah → tagged text } */

export function getBundledTajweedSurahMap(surah: number): Record<number, string> | null {

  const fromAsset = getQuranTajweedSurahAyahMap(surah);

  if (fromAsset) return fromAsset;

  return getLegacySurahMap(surah);

}



export async function loadBundledTajweedSurahMap(surah: number): Promise<Record<number, string> | null> {

  await ensureBundledQuranTajweedLoaded();

  return getBundledTajweedSurahMap(surah);

}



export function releaseBundledQuranTajweedMemory(): void {

  legacyBundle = null;

  legacyLoadPromise = null;

  releaseBundledJsonMemory("quran-tajweed-offline.json");

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("./quranTajweedAsset").releaseQuranTajweedAssetMemory();

}

