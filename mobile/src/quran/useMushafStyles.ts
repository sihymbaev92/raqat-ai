import { useMemo } from "react";
import type { QuranArabicFontPresetId } from "../config/quranArabicFontPresets";
import type { MushafDensityId, MushafDensityPreset } from "../config/mushafConfig";
import type { QuranReadingThemeId } from "../theme/quranComReadingTheme";
import { getMushafDensityPreset } from "../config/mushafConfig";
import { useMushafLayoutMetrics } from "./useMushafLayoutMetrics";
import type { MushafTypographyMetrics } from "./mushafTypography";

export type UseMushafStylesArgs = {
  arabicFontPreset: QuranArabicFontPresetId;
  mushafTextScale: number;
  isDark: boolean;
  mushafDensity: MushafDensityId;
  /** Хатым/мұсаф: кітап қарпі мен Quran.com темасы */
  mushafBookLike?: boolean;
  readingThemeId?: QuranReadingThemeId;
};

export type MushafStylesBundle = {
  /** Типография (`makeStyles` үшін бір көз) */
  metrics: MushafTypographyMetrics;
  /** `mushafConfig` пресеті (metrics.densityLayout-пен бірдей, экспортқа ыңғайлы) */
  densityPreset: MushafDensityPreset;
};

/**
 * Мұсаф оқу типографиясы: `mushafConfig` + `useMushafLayoutMetrics`.
 * Толық StyleSheet әлі `QuranSurahScreen` `makeStyles` ішінде — metrics осы hook арқылы беріледі.
 */
export function useMushafStyles({
  arabicFontPreset,
  mushafTextScale,
  isDark,
  mushafDensity,
  mushafBookLike,
  readingThemeId,
}: UseMushafStylesArgs): MushafStylesBundle {
  const metrics = useMushafLayoutMetrics(
    arabicFontPreset,
    mushafTextScale,
    isDark,
    mushafDensity,
    mushafBookLike === true,
    readingThemeId
  );
  const densityPreset = useMemo(() => getMushafDensityPreset(mushafDensity), [mushafDensity]);
  return { metrics, densityPreset };
}
