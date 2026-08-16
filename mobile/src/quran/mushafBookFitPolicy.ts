import { lookupQuranReadingTheme, type QuranReadingThemeId } from "../theme/quranComReadingTheme";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";

type OnePageFitInput = {
  arabicScriptEdition: QuranArabicScriptEditionId;
  readingThemeId?: QuranReadingThemeId;
  mushafLayout?: boolean;
  bookPageLayout?: boolean;
  showReaderTranslit?: boolean;
  showReaderMeaning?: boolean;
};

/** Хатым / Quran.com original: бір Hafs беті — бір экран, скроллсыз (тығыз беттер scale-down). */
export function shouldForceMushafOnePageFit({
  arabicScriptEdition,
  readingThemeId,
  mushafLayout = true,
  bookPageLayout = true,
  showReaderTranslit = false,
  showReaderMeaning = false,
}: OnePageFitInput): boolean {
  if (showReaderTranslit || showReaderMeaning) return false;
  if (!mushafLayout || !bookPageLayout) return false;
  if (arabicScriptEdition === "turkish" || readingThemeId === "muftyat") return true;
  if (readingThemeId) {
    return lookupQuranReadingTheme(readingThemeId).minimalPageChrome;
  }
  return false;
}

export function forcedMushafReaderLayers(
  forceOnePageFit: boolean,
  showReaderTranslit: boolean,
  showReaderMeaning: boolean
): { showReaderTranslit: boolean; showReaderMeaning: boolean } {
  if (!forceOnePageFit) {
    return { showReaderTranslit, showReaderMeaning };
  }
  return { showReaderTranslit: false, showReaderMeaning: false };
}

/** Сиrek беттер (<220 glyph): масштаб 1. Тығыз беттер: кішірейту. */
export function mushafOnePageFitScale(
  glyphs: number,
  viewportHeight: number,
  profile: "pager" | "book"
): number {
  if (glyphs > 0 && glyphs < 220) return 1;
  const heightPenalty =
    viewportHeight > 0 && viewportHeight < 640
      ? profile === "pager"
        ? 0.05
        : 0.03
      : 0;
  const densePenalty =
    profile === "pager"
      ? glyphs > 1350
        ? 0.26
        : glyphs > 1150
          ? 0.22
          : glyphs > 950
            ? 0.18
            : glyphs > 720
              ? 0.13
              : 0.08
      : glyphs > 1250
        ? 0.2
        : glyphs > 1050
          ? 0.16
          : glyphs > 850
            ? 0.12
            : glyphs > 650
              ? 0.08
              : 0.04;
  const maxScale = profile === "pager" ? 0.86 : 0.9;
  const minScale = 0.58;
  return Math.max(minScale, Math.min(maxScale, 0.9 - densePenalty - heightPenalty));
}
