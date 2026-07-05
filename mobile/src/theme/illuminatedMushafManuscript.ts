import {
  resolveQuranReadingTheme,
  QURAN_READING_CREAM,
  type QuranReadingThemeId,
} from "./quranComReadingTheme";

/** Хатым кітап беті — Ayah-style жұмсақ сүт (#FDFBF7). */
export const MUSHAF_BOOK_PAGE_FACE_LIGHT = QURAN_READING_CREAM;

/**
 * Мұсаф / хатым — Quran.com оқу темасы (Original, Paper, Sepia, Dark, Muftyat).
 */
export type IlluminatedManuscriptPalette = {
  frameOuter: string;
  frameGold: string;
  frameInner: string;
  pageFace: string;
  desk: string;
  markerRingOuter: string;
  markerRingMid: string;
  markerFace: string;
  markerInk: string;
  titleInk: string;
  titlePaperBg: string;
  titlePaperBorder: string;
  bismBorder: string;
  bismSurface: string;
  pageBorderVertical: boolean;
  pageBorderColor: string;
  padOuter: number;
  padGold: number;
  padInner: number;
  rOuter: number;
  rGold: number;
  rInner: number;
  rPage: number;
};

export function illuminatedManuscriptPalette(
  _isDark: boolean,
  readingThemeId?: QuranReadingThemeId | null
): IlluminatedManuscriptPalette {
  const t = resolveQuranReadingTheme(readingThemeId ?? "original");
  return {
    frameOuter: t.pageBorderColor,
    frameGold: t.pageBorderColor,
    frameInner: t.pageBorderColor,
    pageFace: t.pageFace,
    desk: t.desk,
    markerRingOuter: t.markerRingOuter,
    markerRingMid: t.markerFace,
    markerFace: t.markerFace,
    markerInk: t.markerInk,
    titleInk: t.titleInk,
    titlePaperBg: t.titlePaperBg,
    titlePaperBorder: t.titlePaperBorder,
    bismBorder: t.bismBorder,
    bismSurface: t.bismSurface,
    pageBorderVertical: t.pageBorderVertical,
    pageBorderColor: t.pageBorderColor,
    padOuter: 0,
    padGold: 0,
    padInner: 0,
    rOuter: 0,
    rGold: 0,
    rInner: 0,
    rPage: 0,
  };
}
