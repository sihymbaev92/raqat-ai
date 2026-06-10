import { Platform } from "react-native";
import {
  type QuranArabicFontPresetId,
  effectiveArabicPresetForMushafBook,
  isMuftyatStyleArabicPreset,
  quranArabicAyahTextMetrics,
} from "../config/quranArabicFontPresets";
import { type MushafDensityId, type MushafDensityPreset, getMushafDensityPreset } from "../config/mushafConfig";
import { clampMushafTextScale } from "./mushafTextScale";
import { muftyatQuranArabicInk } from "../theme/muftyatQuranStyle";
import {
  DEFAULT_QURAN_READING_THEME,
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";

export type MushafTypographyMetrics = {
  scale: number;
  arabAyahFont: ReturnType<typeof quranArabicAyahTextMetrics>;
  mushafArabSize: number | undefined;
  mushafArabLineHeight: number | undefined;
  mushafTitleFs: number;
  mushafTitleLh: number;
  mushafBismFont: number | undefined;
  mushafBismLh: number | undefined;
  mushafPageInk: string;
  density: MushafDensityId;
  densityLayout: MushafDensityPreset;
};

export type ComputeMushafTypographyOptions = {
  /** Хатым/мұсаф кітап оқуы: нақышты қаріп + тема сиясы */
  bookMushaf?: boolean;
  readingThemeId?: QuranReadingThemeId;
};

export function computeMushafTypography(
  arabicFontPreset: QuranArabicFontPresetId,
  mushafTextScale: number,
  isDark: boolean,
  density: MushafDensityId = "medium",
  opts?: ComputeMushafTypographyOptions
): MushafTypographyMetrics {
  const densityLayout = getMushafDensityPreset(density);
  const themeId = opts?.readingThemeId ?? DEFAULT_QURAN_READING_THEME;
  const theme = resolveQuranReadingTheme(themeId);
  const qcomBook = opts?.bookMushaf === true && theme.minimalPageChrome;
  const presetForMetrics =
    opts?.bookMushaf === true
      ? effectiveArabicPresetForMushafBook(arabicFontPreset, themeId)
      : arabicFontPreset;
  const arabicLineFontFamily = Platform.select<string | undefined>({
    ios: undefined,
    android: "sans-serif-medium",
    default: undefined,
  });
  const arabAyahFont = quranArabicAyahTextMetrics(presetForMetrics, arabicLineFontFamily);
  const scale = clampMushafTextScale(mushafTextScale);
  const bookScaleBoost = qcomBook ? 1 : opts?.bookMushaf === true ? 1.04 : 1;
  /** Quran.com кітап: жол биіктігі жайлы оқуға — аят жолдары тым жапсаспай, көзге ыңғайлы. */
  const lineHeightFactor = qcomBook
    ? Math.max(1.17, densityLayout.arabLineHeightFactor)
    : densityLayout.arabLineHeightFactor;
  const mushafArabSize =
    typeof arabAyahFont.fontSize === "number"
      ? Math.round(arabAyahFont.fontSize * 1.02 * scale * bookScaleBoost)
      : undefined;
  const mushafArabLineHeight =
    typeof arabAyahFont.lineHeight === "number"
      ? Math.round(arabAyahFont.lineHeight * lineHeightFactor * scale * bookScaleBoost)
      : undefined;
  const mushafTitleFs = Math.round(22 * scale);
  const mushafTitleLh = Math.round(28 * scale);
  const mushafBismFont =
    typeof arabAyahFont.fontSize === "number"
      ? Math.round(arabAyahFont.fontSize * densityLayout.bismFontFactor * scale)
      : undefined;
  const mushafBismLh =
    typeof arabAyahFont.lineHeight === "number"
      ? Math.round(arabAyahFont.lineHeight * densityLayout.bismLineHeightFactor * scale)
      : undefined;
  const useMuftyatInk = isMuftyatStyleArabicPreset(presetForMetrics);
  const mushafPageInk =
    opts?.bookMushaf === true
      ? resolveQuranReadingTheme(themeId).arabicInk
      : useMuftyatInk
        ? muftyatQuranArabicInk(isDark)
        : isDark
          ? "#FFFFFF"
          : "#000000";
  return {
    scale,
    arabAyahFont,
    mushafArabSize,
    mushafArabLineHeight,
    mushafTitleFs,
    mushafTitleLh,
    mushafBismFont,
    mushafBismLh,
    mushafPageInk,
    density,
    densityLayout,
  };
}
