import { globalAyahToRef, surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import {
  globalAyahAtMushafPageStart,
  HAFS_MUSHAF_PAGE_COUNT,
} from "../data/quranHafsPageFromGlobalAyah";
import { QURAN_JUZ_STARTS, juzForSurahAyah } from "../data/quranJuzBoundaries";
import { mushafDisplayPageFromGlobalAyahOneBased } from "../data/quranMushafPageByGlobalAyah";
import { juzAtSurahStart, mushafStartPageForSurah } from "../data/surahListMeta";

export type QuranNavCoords = {
  surah: number;
  juz: number;
  page: number;
};

export const QURAN_NAV_JUZ_VALUES = Array.from({ length: 30 }, (_, i) => i + 1);
export const QURAN_NAV_PAGE_VALUES = Array.from({ length: HAFS_MUSHAF_PAGE_COUNT }, (_, i) => i + 1);
export const QURAN_NAV_SURAH_VALUES = Array.from({ length: 114 }, (_, i) => i + 1);

export function clampQuranNavCoords(c: QuranNavCoords): QuranNavCoords {
  const surah = Math.max(1, Math.min(114, Math.floor(c.surah)));
  const juz = Math.max(1, Math.min(30, Math.floor(c.juz)));
  const page = Math.max(1, Math.min(HAFS_MUSHAF_PAGE_COUNT, Math.floor(c.page)));
  return { surah, juz, page };
}

export function coordsFromSurah(surah: number): QuranNavCoords {
  const s = Math.max(1, Math.min(114, Math.floor(surah)));
  return {
    surah: s,
    juz: juzAtSurahStart(s),
    page: mushafStartPageForSurah(s),
  };
}

export function coordsFromJuz(juz: number): QuranNavCoords {
  const j = Math.max(1, Math.min(30, Math.floor(juz)));
  const row = QURAN_JUZ_STARTS.find((x) => x.juz === j) ?? QURAN_JUZ_STARTS[0]!;
  const page = mushafDisplayPageFromGlobalAyahOneBased(
    surahAyahToGlobalOneBased(row.startSurah, row.startAyah)
  );
  return { surah: row.startSurah, juz: j, page };
}

/** Таңдалған джуздағы Hafs беттері (1..604). */
export function mushafPageRangeForJuz(juz: number): { first: number; last: number } {
  const j = Math.max(1, Math.min(30, Math.floor(juz)));
  const first = coordsFromJuz(j).page;
  const last =
    j >= 30 ? HAFS_MUSHAF_PAGE_COUNT : Math.max(first, coordsFromJuz(j + 1).page - 1);
  return { first, last };
}

export function quranNavPageValuesForJuz(juz: number): readonly number[] {
  const { first, last } = mushafPageRangeForJuz(juz);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

export function coordsFromPage(page: number): QuranNavCoords {
  const p = Math.max(1, Math.min(HAFS_MUSHAF_PAGE_COUNT, Math.floor(page)));
  const global = globalAyahAtMushafPageStart(p);
  const { surah, ayah } = globalAyahToRef(global);
  return {
    surah,
    juz: juzForSurahAyah(surah, ayah),
    page: p,
  };
}

export function initialAyahForNavCoords(c: QuranNavCoords): number {
  const global = globalAyahAtMushafPageStart(c.page);
  const ref = globalAyahToRef(global);
  if (ref.surah === c.surah) return ref.ayah;
  return 1;
}
