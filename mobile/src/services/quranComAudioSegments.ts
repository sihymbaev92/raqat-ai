import { quranComReciterIdForEdition } from "../config/quranComReciterMap";

/** Quran.com: [word_start, word_end_exclusive, start_ms, end_ms] */
export type QuranComAyahSegment = readonly [number, number, number, number];

export type QuranComAyahAudioMeta = {
  segments: QuranComAyahSegment[];
  /** Сегменттердің соңғы шегі — MP3 ұзақтығымен салыстыру үшін */
  referenceDurationMs: number;
};

const cache = new Map<string, QuranComAyahAudioMeta | null>();

function cacheKey(surah: number, ayah: number, reciterId: number): string {
  return `${reciterId}:${surah}:${ayah}`;
}

function parseSegments(raw: unknown): QuranComAyahSegment[] {
  if (!Array.isArray(raw)) return [];
  const out: QuranComAyahSegment[] = [];
  for (const row of raw) {
    if (!Array.isArray(row) || row.length < 4) continue;
    const w0 = Number(row[0]);
    const w1 = Number(row[1]);
    const s = Number(row[2]);
    const e = Number(row[3]);
    if (!Number.isFinite(w0) || !Number.isFinite(w1) || !Number.isFinite(s) || !Number.isFinite(e)) continue;
    if (e <= s) continue;
    out.push([Math.floor(w0), Math.floor(w1), Math.floor(s), Math.floor(e)]);
  }
  return out;
}

/**
 * Аят MP3 үшін сөз уақыт белгілері (Quran.com CDN metadata).
 * Сәтсіз болса null — proportional караоке қалдырылады.
 */
export async function fetchQuranComAyahAudioSegments(
  surah: number,
  ayah: number,
  edition: string
): Promise<QuranComAyahAudioMeta | null> {
  const reciterId = quranComReciterIdForEdition(edition);
  if (!reciterId || surah < 1 || surah > 114 || ayah < 1) return null;

  const key = cacheKey(surah, ayah, reciterId);
  if (cache.has(key)) return cache.get(key) ?? null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const url = `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?audio=${reciterId}`;
    const r = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
    if (!r.ok) {
      cache.set(key, null);
      return null;
    }
    const j = (await r.json()) as {
      verse?: { audio?: { segments?: unknown } };
    };
    const segments = parseSegments(j.verse?.audio?.segments);
    if (!segments.length) {
      cache.set(key, null);
      return null;
    }
    const referenceDurationMs = segments[segments.length - 1]![3];
    const meta: QuranComAyahAudioMeta = { segments, referenceDurationMs };
    cache.set(key, meta);
    return meta;
  } catch {
    // Желілік timeout уақытша болуы мүмкін; келесі ойнатуда қайта сынауға мүмкіндік қалдырамыз.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
