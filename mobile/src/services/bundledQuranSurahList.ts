/**
 * Жеңіл сүре тізімі — boot кезінде толық Uthmani/KK JSON жүктелмейді.
 */
import { Platform } from "react-native";
import surahListApk from "../../assets/bundled/surah-list-api.json";
import type { CachedSurah } from "../storage/quranListCache";
import { parseSurahsFromApiJson } from "../storage/quranListCache";
import { loadBundledJson, releaseBundledJsonMemory } from "../utils/loadBundledJson";

let listCache: CachedSurah[] | null = null;
let surahListPromise: Promise<void> | null = null;

function apkSurahListBundle(): unknown | null {
  if (Platform.OS === "web" || process.env.NODE_ENV === "test") return null;
  return surahListApk;
}

async function loadSurahListOnlyAsync(): Promise<void> {
  if (listCache?.length) return;
  const apk = apkSurahListBundle();
  const parsed = apk
    ? parseSurahsFromApiJson(apk)
    : parseSurahsFromApiJson(await loadBundledJson("surah-list-api.json"));
  if (!parsed?.length) {
    listCache = null;
    throw new Error("bundled quran surah list empty");
  }
  listCache = parsed;
}

/** Тек сүрелер тізімі. Толық Құран JSON-дарын boot/list кезінде парстемейді. */
export async function ensureBundledSurahListLoaded(): Promise<void> {
  if (listCache?.length) return;
  if (!surahListPromise) {
    surahListPromise = loadSurahListOnlyAsync().catch((err) => {
      surahListPromise = null;
      throw err;
    });
  }
  try {
    await surahListPromise;
  } catch {
    surahListPromise = null;
    throw new Error("bundled quran surah list load failed");
  }
  if (!listCache?.length) {
    surahListPromise = null;
    throw new Error("bundled quran surah list load failed");
  }
}

export function getBundledSurahList(): CachedSurah[] | null {
  return listCache?.length ? listCache : null;
}

export function setBundledSurahList(list: CachedSurah[] | null): void {
  listCache = list?.length ? list : null;
}

export function releaseBundledSurahListMemory(): void {
  listCache = null;
  surahListPromise = null;
  releaseBundledJsonMemory("surah-list-api.json");
}
