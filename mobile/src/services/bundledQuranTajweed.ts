import { loadBundledJson, releaseBundledJsonMemory } from "../utils/loadBundledJson";

type TajweedOfflineBundle = {
  version?: number;
  source?: string;
  generatedAt?: string;
  surahs?: Record<string, Record<string, string>>;
};

let bundle: TajweedOfflineBundle | null = null;
let loadPromise: Promise<void> | null = null;

export async function ensureBundledQuranTajweedLoaded(): Promise<void> {
  if (bundle) return;
  if (!loadPromise) {
    loadPromise = loadBundledJson<TajweedOfflineBundle>("quran-tajweed-offline.json")
      .then((loaded) => {
        bundle = loaded;
        releaseBundledJsonMemory("quran-tajweed-offline.json");
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function getBundledTajweedAyahText(surah: number, ayahInSurah: number): string | null {
  const text = bundle?.surahs?.[String(surah)]?.[String(ayahInSurah)]?.trim();
  return text?.includes("[") ? text : null;
}

/** Сураның барлық аяттары: { ayahInSurah → tagged text } */
export function getBundledTajweedSurahMap(surah: number): Record<number, string> | null {
  const raw = bundle?.surahs?.[String(surah)];
  if (!raw) return null;
  const out: Record<number, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const n = Number(k);
    const text = (v ?? "").trim();
    if (Number.isFinite(n) && text.includes("[")) out[n] = text;
  }
  return Object.keys(out).length ? out : null;
}

export async function loadBundledTajweedSurahMap(surah: number): Promise<Record<number, string> | null> {
  await ensureBundledQuranTajweedLoaded();
  return getBundledTajweedSurahMap(surah);
}
