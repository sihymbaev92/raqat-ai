import { Platform, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { fitSingleLineTextProps } from "../theme/textLayoutGuard";

/** Хатым парағы: экран жиегінен дәл 5px қауіпсіз шет. */
export const HATIM_PAGE_HORIZONTAL_SAFE_INSET = 5;

/** Экран жиегінен минималды бос орын (≥16px). */
export const QURAN_AYAH_MIN_HORIZONTAL_PADDING = 20;
export const QURAN_SCREEN_HORIZONTAL_PADDING = 20;
export const QURAN_SCREEN_VERTICAL_PADDING = 16;
export const QURAN_HATIM_COMPACT_LINE_HEIGHT_FACTOR = 1.62;
export const QURAN_HATIM_COMPACT_MIN_FONT = 18;
/** Хатым бір жолдық авто-fit: базалық қаріп (экран еніне сыймаса кішірейеді). */
export const HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE = 32;
export const HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE = 0.5;
export const QURAN_HATIM_COMPACT_PADDING_H = QURAN_AYAH_MIN_HORIZONTAL_PADDING;
export const QURAN_HATIM_COMPACT_PADDING_V = 10;
/** Сүре оқу (scroll): жайлы line-height. */
export const QURAN_AYAH_LINE_HEIGHT_FACTOR = 1.8;

const REFERENCE_PHONE_WIDTH = 390;
const MIN_READABLE_FONT = 16;
const MIN_HATIM_FONT = 18;
const AYAH_STYLE_FONT_MIN = 22;
const AYAH_STYLE_FONT_MAX = 28;
const AYAH_STYLE_FONT_WIDTH_FACTOR = 0.065;

/**
 * Flutter KhatmQuranScreen формуласы: screenWidth * 0.065, 22–28 px аралығыnda.
 * @see responsiveQuranFontSizeAyahStyle
 */
export function responsiveQuranFontSizeAyahStyle(screenWidth: number): number {
  const w = Math.max(280, screenWidth);
  const fs = w * AYAH_STYLE_FONT_WIDTH_FACTOR;
  return Math.round(Math.min(AYAH_STYLE_FONT_MAX, Math.max(AYAH_STYLE_FONT_MIN, fs)));
}

/** Телефон еніне байланған базалық араб қарпі — ешқашан оқуға болмайтын деңгейге кішіреймейді. */
export function responsiveQuranFontSize(
  contentWidth: number,
  baseFontSize: number,
  opts?: { fitScale?: number; minFontSize?: number }
): number {
  const w = Math.max(280, contentWidth);
  const widthFactor = Math.min(1.08, Math.max(0.82, w / REFERENCE_PHONE_WIDTH));
  const fit = Math.max(0.88, Math.min(1, opts?.fitScale ?? 1));
  const minFs = opts?.minFontSize ?? MIN_READABLE_FONT;
  return Math.max(minFs, Math.round(baseFontSize * widthFactor * fit));
}

export function responsiveQuranLineHeight(fontSize: number, compact?: boolean): number {
  const factor = compact ? QURAN_HATIM_COMPACT_LINE_HEIGHT_FACTOR : QURAN_AYAH_LINE_HEIGHT_FACTOR;
  return Math.max(Math.round(fontSize * factor), fontSize + 10);
}

export function resolveQuranArabicTypography(
  contentWidth: number,
  baseFontSize: number,
  opts?: { compact?: boolean; fitScale?: number; minFontSize?: number; ayahScrollStyle?: boolean }
): { fontSize: number; lineHeight: number } {
  const minFontSize = opts?.minFontSize ?? (opts?.compact ? MIN_HATIM_FONT : MIN_READABLE_FONT);
  const fontSize = opts?.ayahScrollStyle && !opts.compact
    ? responsiveQuranFontSizeAyahStyle(contentWidth)
    : responsiveQuranFontSize(contentWidth, baseFontSize, {
        fitScale: opts?.fitScale,
        minFontSize,
      });
  return {
    fontSize,
    lineHeight: responsiveQuranLineHeight(fontSize, opts?.compact),
  };
}

/** RTL контейнер — аят блоктары осы стильде (direction + padding). */
export function quranRtlContainerStyle(
  paddingH = QURAN_SCREEN_HORIZONTAL_PADDING,
  paddingV?: number
): ViewStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    direction: "rtl",
    paddingHorizontal: Math.max(QURAN_AYAH_MIN_HORIZONTAL_PADDING, paddingH),
    ...(paddingV != null ? { paddingVertical: paddingV } : null),
    overflow: "visible" as const,
  };
}

/** Аят мәтіні — кесілмей, автоматты wrap, оңға тураланған. */
export function quranAyahTextStyle(fontSize: number, lineHeight: number, extra?: TextStyle): TextStyle {
  return {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    minWidth: 0,
    maxWidth: "100%",
    alignSelf: "stretch",
    fontSize,
    lineHeight,
    textAlign: "right",
    writingDirection: "rtl",
    letterSpacing: 0,
    ...(Platform.OS === "android" ? { textBreakStrategy: "highQuality" as const } : null),
    ...(Platform.OS === "web"
      ? ({ whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" } as TextStyle)
      : null),
    ...extra,
  };
}

/** Аят + маркер қатары — flexWrap wrap, экраннан шықпайды. */
export function quranAyahRowStyle(): ViewStyle {
  return {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    direction: "rtl",
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    overflow: "visible" as const,
  };
}

/** Хатым: барлық аяттар бір үздіксіз RTL ағыны — мәтін → маркер → келесі аят. */
export function quranContinuousFlowStyle(): ViewStyle {
  return {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    direction: "rtl",
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    overflow: "visible" as const,
  };
}

/** Хатым: бір аят — бір жол, сыймаса 50%-ға дейін кішірейеді (iOS/Android adjustsFontSizeToFit). */
export function hatimAyahAutoFitTextProps(): Pick<
  TextProps,
  | "numberOfLines"
  | "maxFontSizeMultiplier"
  | "adjustsFontSizeToFit"
  | "minimumFontScale"
  | "allowFontScaling"
> {
  return fitSingleLineTextProps({
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    minimumFontScale: HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE,
  });
}

export function hatimAyahAutoFitTextStyle(
  fontSize = HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE
): Pick<TextStyle, "fontSize" | "width"> {
  return {
    fontSize,
    width: "100%",
  };
}

/** Үздіксіз ағын ішіндегі араб мәтін (маркермен бір жолда ағады). */
export function quranInlineAyahTextStyle(fontSize: number, lineHeight: number, extra?: TextStyle): TextStyle {
  return {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 0,
    maxWidth: "100%",
    fontSize,
    lineHeight,
    textAlign: "right",
    writingDirection: "rtl",
    letterSpacing: 0,
    ...(Platform.OS === "android" ? { textBreakStrategy: "highQuality" as const } : null),
    ...(Platform.OS === "web"
      ? ({ whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" } as TextStyle)
      : null),
    ...extra,
  };
}

/** Бір аят сегменті: мәтін + маркер (RTL, wrap). */
export function quranContinuousAyahSegmentStyle(): ViewStyle {
  return {
    flexDirection: "row",
    flexWrap: "wrap",
    direction: "rtl",
    alignItems: "center",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexShrink: 1,
    maxWidth: "100%",
    overflow: "visible" as const,
  };
}

/** Сүре режимі: маркер + араб кластері (RTL wrap). */
export function quranSurahAyahClusterStyle(gap = 8): ViewStyle {
  return {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    direction: "rtl",
    alignItems: "flex-start",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    gap,
    overflow: "visible" as const,
  };
}

/** Сүре режимі: араб мәтін орауышы. */
export function quranSurahArabicWrapStyle(): ViewStyle {
  return {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    minWidth: 0,
    maxWidth: "100%",
    alignSelf: "stretch",
    overflow: "visible" as const,
  };
}
