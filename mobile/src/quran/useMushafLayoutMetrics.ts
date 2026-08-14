import { useMemo } from "react";
import type { QuranArabicFontPresetId } from "../config/quranArabicFontPresets";
import type { MushafDensityId } from "../config/mushafConfig";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";
import { computeMushafTypography, type MushafTypographyMetrics } from "./mushafTypography";

/** Мұсаф оқу экранының типографиялық метрикалары (`makeStyles` пен бір көзден). */
export function useMushafLayoutMetrics(
  arabicFontPreset: QuranArabicFontPresetId,
  mushafTextScale: number,
  isDark: boolean,
  mushafDensity: MushafDensityId,
  bookMushaf?: boolean,
  readingThemeId?: QuranReadingThemeId,
  quranSurahReader?: boolean
): MushafTypographyMetrics {
  return useMemo(
    () =>
      computeMushafTypography(arabicFontPreset, mushafTextScale, isDark, mushafDensity, {
        bookMushaf: bookMushaf === true,
        quranSurahReader: quranSurahReader === true,
        readingThemeId,
      }),
    [arabicFontPreset, mushafTextScale, isDark, mushafDensity, bookMushaf, readingThemeId, quranSurahReader]
  );
}
