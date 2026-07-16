import {
  mergeTajweedTaggedIntoAyahs,
  parseAyahsFromApiResponse,
  type CachedAyah,
} from "../storage/quranSurahCache";
import { loadBundledTajweedSurahMap } from "./bundledQuranTajweed";

const surahTajweedUrl = (n: number) => `https://api.alquran.cloud/v1/surah/${n}/quran-tajweed`;

export const QURAN_CLOUD_FETCH_TIMEOUT_MS = 14_000;

export async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

export function shouldShowMushafBismillahBanner(surahNumber: number): boolean {
  if (surahNumber === 9) return false;
  if (surahNumber === 1) return false;
  return true;
}

export async function enrichAyahsWithAlquranTajweed(
  surahNum: number,
  ayahs: CachedAyah[]
): Promise<CachedAyah[]> {
  try {
    const bundled = await loadBundledTajweedSurahMap(surahNum);
    if (bundled) {
      return ayahs.map((a) => {
        const textTajweed = (bundled[a.numberInSurah] ?? "").trim();
        return textTajweed.includes("[") ? { ...a, textTajweed } : a;
      });
    }
    const rt = await fetchWithTimeout(surahTajweedUrl(surahNum), QURAN_CLOUD_FETCH_TIMEOUT_MS);
    if (!rt.ok) return ayahs;
    const jt = await rt.json();
    const tagged = parseAyahsFromApiResponse(jt);
    return mergeTajweedTaggedIntoAyahs(ayahs, tagged);
  } catch {
    return ayahs;
  }
}
