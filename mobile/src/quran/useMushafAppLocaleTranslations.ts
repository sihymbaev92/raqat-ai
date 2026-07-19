import { useEffect, useRef } from "react";
import type { MushafBookPageSlice } from "./mushafBookTypes";
import type { QuranReadingLocale } from "./quranReadingLocale";
import { ensureBundledQuranTranslationsLoaded } from "../services/quranOfflineTranslations";
import {
  getQuranSurahTranslation,
  isQuranTranslationLocale,
  mergeTranslationIntoMushafPages,
  quranTranslationFieldForLocale,
  type QuranTranslationLocale,
} from "../services/quranTranslationEditions";

function surahsOnPageIndices(pages: MushafBookPageSlice[], indices: number[]): number[] {
  const set = new Set<number>();
  for (const ix of indices) {
    const page = pages[ix];
    if (!page) continue;
    for (const ayah of page.ayahs) set.add(ayah.surahNumber);
  }
  return [...set];
}

function surahsMissingLocaleField(
  pages: MushafBookPageSlice[],
  surahs: number[],
  locale: QuranTranslationLocale
): number[] {
  const field = quranTranslationFieldForLocale(locale);
  return surahs.filter((surah) =>
    pages.some((page) =>
      page.ayahs.some(
        (a) => a.surahNumber === surah && !((a[field] as string | undefined) ?? "").trim()
      )
    )
  );
}

/**
 * Хатым/мұсаф: оқу аударма тілі өзгергенде немесе бет ауыскanda сол тілдегі аударманы
 * offline bundle / кэш / API арқылы page state-ке енгізеді.
 */
export function useMushafAppLocaleTranslations(
  pages: MushafBookPageSlice[],
  setPages: React.Dispatch<React.SetStateAction<MushafBookPageSlice[]>>,
  readingLocale: QuranReadingLocale,
  pageIndex: number
): void {
  const inFlightRef = useRef(new Set<string>());

  useEffect(() => {
    if (!pages.length || !isQuranTranslationLocale(readingLocale)) return;

    const neighborIndices = [
      Math.max(0, pageIndex - 1),
      pageIndex,
      Math.min(pages.length - 1, pageIndex + 1),
    ];
    const surahs = surahsOnPageIndices(pages, neighborIndices);
    const missing = surahsMissingLocaleField(pages, surahs, readingLocale);
    if (!missing.length) return;

    let alive = true;
    void ensureBundledQuranTranslationsLoaded(readingLocale);

    for (const surah of missing) {
      const key = `${readingLocale}:${surah}`;
      if (inFlightRef.current.has(key)) continue;
      inFlightRef.current.add(key);
      void (async () => {
        try {
          const map = await getQuranSurahTranslation(surah, readingLocale);
          if (alive && map) {
            setPages((prev) => mergeTranslationIntoMushafPages(prev, readingLocale, surah, map));
          }
        } finally {
          inFlightRef.current.delete(key);
        }
      })();
    }

    return () => {
      alive = false;
    };
  }, [pages, pageIndex, readingLocale, setPages]);
}
