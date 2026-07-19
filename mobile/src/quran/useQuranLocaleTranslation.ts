import { useEffect } from "react";
import type { CachedAyah } from "../storage/quranSurahCache";
import { useQuranReadingLocale } from "./quranReadingLocale";
import {
  ayahsHaveTranslation,
  getQuranSurahTranslation,
  isQuranTranslationLocale,
  mergeTranslationIntoAyahs,
} from "../services/quranTranslationEditions";

/**
 * Оқу аударма тілі ru/en/… болғанда сүре аудармасын кэштен не желіден алып,
 * аят тізіміне құяды. kk болса — еш нәрсе істемейді.
 */
export function useQuranLocaleTranslation(
  surahNumber: number,
  ayahs: CachedAyah[],
  setAyahs: (updater: (prev: CachedAyah[]) => CachedAyah[]) => void
): void {
  const locale = useQuranReadingLocale();

  useEffect(() => {
    if (!isQuranTranslationLocale(locale)) return;
    if (!ayahs.length) return;
    if (ayahsHaveTranslation(ayahs, locale)) return;

    let alive = true;
    void (async () => {
      const map = await getQuranSurahTranslation(surahNumber, locale);
      if (!alive || !map) return;
      setAyahs((prev) => mergeTranslationIntoAyahs(prev, locale, map));
    })();
    return () => {
      alive = false;
    };
  }, [locale, surahNumber, ayahs, setAyahs]);
}
