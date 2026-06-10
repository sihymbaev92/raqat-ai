import { parseAyahsFromApiResponse, type CachedAyah } from "../storage/quranSurahCache";

function surahEditionUrl(surahOneBased: number, editionSlug: string): string {
  return `https://api.alquran.cloud/v1/surah/${surahOneBased}/${editionSlug}`;
}

/**
 * Бір сүре үшін Мадина стиліндегі Усмани (`quran-uthmani`) мен Unicode араб (`quran-unicode`) мәтіндерін
 * параллель жүктейді — кеште екінші жол ретінде сақталады.
 */
export async function fetchAlquranUthmaniAndUnicodeAyahs(
  surahOneBased: number,
  timeoutMs: number
): Promise<{ madinah: CachedAyah[] | null; turkishPrint: CachedAyah[] | null }> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const [ru, rt] = await Promise.all([
      fetch(surahEditionUrl(surahOneBased, "quran-uthmani"), { signal: ctrl.signal }),
      fetch(surahEditionUrl(surahOneBased, "quran-unicode"), { signal: ctrl.signal }),
    ]);
    const ju = ru.ok ? await ru.json() : null;
    const jt = rt.ok ? await rt.json() : null;
    return {
      madinah: ju ? parseAyahsFromApiResponse(ju) : null,
      turkishPrint: jt ? parseAyahsFromApiResponse(jt) : null,
    };
  } catch {
    return { madinah: null, turkishPrint: null };
  } finally {
    clearTimeout(id);
  }
}
