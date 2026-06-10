import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";

type OnePageFitInput = {
  arabicScriptEdition: QuranArabicScriptEditionId;
  readingThemeId?: QuranReadingThemeId;
  mushafLayout?: boolean;
  bookPageLayout?: boolean;
};

export function shouldForceMushafOnePageFit({
  arabicScriptEdition,
  readingThemeId,
  mushafLayout = true,
  bookPageLayout = true,
}: OnePageFitInput): boolean {
  return Boolean(
    mushafLayout &&
      bookPageLayout &&
      (arabicScriptEdition === "turkish" || readingThemeId === "muftyat")
  );
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

export function mushafOnePageFitScale(
  glyphs: number,
  viewportHeight: number,
  profile: "pager" | "book"
): number {
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
  return Math.max(0.58, Math.min(maxScale, 0.9 - densePenalty - heightPenalty));
}
