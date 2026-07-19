import { surahAyahToGlobalOneBased } from "./quranAyahCounts";
import { juzForSurahAyah } from "./quranJuzBoundaries";
import { mushafDisplayPageFromGlobalAyahOneBased } from "./quranMushafPageByGlobalAyah";
import { surahRevelationTypeFromBundled } from "../constants/surahBundledMeta";
import { surahTitleForLocale } from "../constants/surahTitleKk";
import { getCurrentLocale } from "../i18n/runtime";
import { kk } from "../i18n/kk";

/** Мұсафта әр сүренің басталатын беті (Хафс 604). */
export const SURAH_MUSHAF_START_PAGES: readonly number[] = Array.from({ length: 114 }, (_, i) =>
  mushafDisplayPageFromGlobalAyahOneBased(surahAyahToGlobalOneBased(i + 1, 1))
);

export function mushafStartPageForSurah(surahNumber: number): number {
  const i = Math.max(1, Math.min(114, Math.floor(surahNumber))) - 1;
  return SURAH_MUSHAF_START_PAGES[i] ?? 1;
}

export function juzAtSurahStart(surahNumber: number): number {
  return juzForSurahAyah(surahNumber, 1);
}

export function surahListNumberedTitle(
  surahNumber: number,
  englishName = "",
  locale?: string,
  tr?: (text: string) => string
): string {
  const loc = locale ?? getCurrentLocale();
  const title = surahTitleForLocale(surahNumber, loc, { englishName, tr });
  return `${surahNumber}. ${title}`;
}

export function surahListMetaSubtitle(surahNumber: number, ayahCount: number): string {
  const rev = surahRevelationTypeFromBundled(surahNumber);
  const place =
    rev === "Meccan"
      ? kk.quran.revelationMeccan
      : rev === "Medinan"
        ? kk.quran.revelationMedinan
        : "—";
  return kk.quran.surahListMetaLine(place, ayahCount);
}
