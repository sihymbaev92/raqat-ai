import type { CachedAyah } from "../storage/quranSurahCache";
import { hasCyrillicScript } from "../utils/quranTranslitDisplay";
import {
  ensureBundledQuranReaderLoaded,
  getBundledBookTranslitForAyah,
  getBundledKkTextForAyah,
  isBundledQuranReaderLoaded,
} from "./bundledQuranReader";

async function ensureKkMapsReady(): Promise<void> {
  await ensureBundledQuranReaderLoaded();
}

/**
 * Кеште қазақша мағына болмаса, runtime бандлдағы asyldin / дерекқор жолын қосады
 * (alquran.cloud тек араб қайтарған жағдай).
 */
export function mergeBundledKkMeaningsIfMissing(surahNumber: number, ayahs: CachedAyah[]): CachedAyah[] {
  if (!ayahs.length || !isBundledQuranReaderLoaded()) return ayahs;
  return ayahs.map((a) => {
    if ((a.textKk ?? "").trim()) return a;
    const kk = getBundledKkTextForAyah(surahNumber, a.numberInSurah);
    return kk ? { ...a, textKk: kk } : a;
  });
}

/**
 * v13 кэшінде латын translit болса да, бандлдағы кітаптық кирилді қояды (хатим/қатым).
 * Кирилл жоқ болса латынды өшіреді — экран арабтан KK генерациялайды.
 */
export function mergeBundledBookTranslitFromDb(surahNumber: number, ayahs: CachedAyah[]): CachedAyah[] {
  if (!ayahs.length || !isBundledQuranReaderLoaded()) return ayahs;
  return ayahs.map((a) => {
    const book = getBundledBookTranslitForAyah(surahNumber, a.numberInSurah);
    if (book) return { ...a, translit: book };
    const tr = (a.translit ?? "").trim();
    if (tr && !hasCyrillicScript(tr)) {
      const { translit: _drop, ...rest } = a;
      return rest;
    }
    return a;
  });
}

/** Runtime бандл: қазақша мағына + кітаптық транскрипция. */
export async function enrichAyahsFromBundledQuranDb(
  surahNumber: number,
  ayahs: CachedAyah[]
): Promise<CachedAyah[]> {
  if (!ayahs.length) return ayahs;
  await ensureKkMapsReady().catch(() => {});
  return mergeBundledBookTranslitFromDb(
    surahNumber,
    mergeBundledKkMeaningsIfMissing(surahNumber, ayahs)
  );
}

/** Синхрон нұсқа — бандл әлі жүктелмеген болса ayahs өзгермейді. */
export function enrichAyahsFromBundledQuranDbSync(
  surahNumber: number,
  ayahs: CachedAyah[]
): CachedAyah[] {
  return mergeBundledBookTranslitFromDb(
    surahNumber,
    mergeBundledKkMeaningsIfMissing(surahNumber, ayahs)
  );
}
