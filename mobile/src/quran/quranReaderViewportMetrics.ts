import { Platform, type TextStyle, type ViewStyle } from "react-native";
import { toEasternArabicIndic } from "../utils/easternArabicIndic";

export type QuranReaderFontSizeMode = "standard" | "large" | "extraLarge";

export interface QuranReaderModeConfig {
  min: number;
  max: number;
  scale: number;
  lineHeightMultiplier: number;
}

/** Font size matrix — Quran.com/Sajda reader modes. */
export const QURAN_READER_FONT_CONFIG: Record<QuranReaderFontSizeMode, QuranReaderModeConfig> = {
  standard: {
    min: 22,
    max: 32,
    scale: 1.0,
    lineHeightMultiplier: 1.9,
  },
  large: {
    min: 26,
    max: 38,
    scale: 1.25,
    lineHeightMultiplier: 2.0,
  },
  extraLarge: {
    min: 30,
    max: 42,
    scale: 1.5,
    lineHeightMultiplier: 2.1,
  },
};

/** @deprecated — `computeQuranReaderHorizontalPadding` қолданылады. */
export const QURAN_READER_HORIZONTAL_INSET = 32;

/** @deprecated — True content width: layout cap жоқ. */
export const QURAN_READER_MAX_LAYOUT_WIDTH = 600;

export const QURAN_READER_FONT_WIDTH_FACTOR = 0.065;

export type QuranReaderViewportMetrics = {
  contentWidth: number;
  horizontalPadding: number;
  fontSize: number;
  lineHeight: number;
  fontSizeMode: QuranReaderFontSizeMode;
  translationFontSize: number;
  translationLineHeight: number;
};

export const toArabicNumerals = toEasternArabicIndic;

/** mushafTextScale (0.88–1.15) → reader font mode. */
export function mushafTextScaleToReaderFontMode(scale: number): QuranReaderFontSizeMode {
  if (scale >= 1.1) return "extraLarge";
  if (scale >= 1.0) return "large";
  return "standard";
}

/**
 * Orientation-aware horizontal padding — Portrait 16–24px, Landscape 20–48px.
 * ~17.5 @ 390dp portrait, ~48 @ 844dp landscape, ~46 @ 1024dp tablet landscape.
 */
export function computeQuranReaderHorizontalPadding(
  screenWidth: number,
  screenHeight?: number
): number {
  const w = Math.max(280, Math.round(screenWidth));
  const h = Math.max(280, Math.round(screenHeight ?? screenWidth));
  const landscape = w > h;

  if (landscape) {
    if (w >= 900) {
      return Math.round(Math.min(48, Math.max(20, w * 0.045)));
    }
    const t = Math.max(0, Math.min(1, (w - 390) / (844 - 390)));
    return Math.round(20 + t * (48 - 20));
  }

  const t = Math.max(0, Math.min(1, (w - 320) / (600 - 320)));
  return Math.round(16 + t * (24 - 16));
}

/**
 * Viewport engine — true content width (layout cap жоқ), orientation-aware padding.
 * `fontSize = clamp(contentWidth × 0.065 × modeScale × extraScale, min, max)`.
 */
export function computeQuranReaderViewportMetrics(
  screenWidth: number,
  fontSizeMode: QuranReaderFontSizeMode = "standard",
  extraScale = 1,
  opts?: { turkishPrint?: boolean; screenHeight?: number }
): QuranReaderViewportMetrics {
  const config = QURAN_READER_FONT_CONFIG[fontSizeMode];
  const width = Math.max(280, screenWidth);
  const horizontalPadding = computeQuranReaderHorizontalPadding(width, opts?.screenHeight);
  const contentWidth = Math.max(244, width - horizontalPadding * 2);
  const calculated = contentWidth * QURAN_READER_FONT_WIDTH_FACTOR * config.scale * extraScale;
  const fontSize = Math.round(Math.max(config.min, Math.min(config.max, calculated)));
  const lineFactor = opts?.turkishPrint
    ? Math.max(config.lineHeightMultiplier, 2.0)
    : config.lineHeightMultiplier;
  const lineHeight = Math.round(fontSize * lineFactor);
  const translationFontSize = Math.round(Math.max(14, fontSize * 0.5));
  const translationLineHeight = Math.round(translationFontSize * 1.5);
  return {
    contentWidth,
    horizontalPadding,
    fontSize,
    lineHeight,
    fontSizeMode,
    translationFontSize,
    translationLineHeight,
  };
}

/** Аят блок контейнері — fixed height жоқ. */
export function quranReaderAyahContainerStyle(): ViewStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    flexShrink: 1,
    overflow: "visible",
  };
}

/** Араб мәтін host — RTL, natural layout. */
export function quranReaderAyahHostStyle(): ViewStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    direction: "rtl",
    alignItems: "stretch",
    overflow: "visible",
  };
}

/** `<Text>` — flexShrink 1, Android harakat clip-safe padding. */
export function quranReaderAyahTextLayoutStyle(extra?: TextStyle): TextStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    flexShrink: 1,
    minWidth: 0,
    maxWidth: "100%",
    textAlign: "right",
    writingDirection: "rtl",
    letterSpacing: 0,
    allowFontScaling: false,
    maxFontSizeMultiplier: 1,
    ...(Platform.OS === "android"
      ? {
          includeFontPadding: true,
          textAlignVertical: "center" as const,
          paddingVertical: 6,
          textBreakStrategy: "highQuality" as const,
        }
      : { paddingVertical: 2 }),
    ...extra,
  };
}
