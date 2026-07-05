import { parseAyahsFromApiResponse } from "../storage/quranSurahCache";

const surahTajweedUrl = (n: number) => `https://api.alquran.cloud/v1/surah/${n}/quran-tajweed`;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

/** Al Quran Cloud tajweed endpoint → аят нөмірі бойынша тақырыпшалы мәтін. */
export async function fetchTajweedAyahMap(
  surah: number,
  timeoutMs: number
): Promise<Record<number, string> | null> {
  try {
    const rt = await fetchWithTimeout(surahTajweedUrl(surah), timeoutMs);
    if (!rt.ok) return null;
    const tagged = parseAyahsFromApiResponse(await rt.json());
    if (!tagged?.length) return null;
    const out: Record<number, string> = {};
    for (const ayah of tagged) {
      const text = (ayah.text ?? "").trim();
      if (text.includes("[")) out[ayah.numberInSurah] = text;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}
