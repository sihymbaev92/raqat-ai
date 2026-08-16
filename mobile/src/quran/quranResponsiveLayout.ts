import { Platform, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import { fitSingleLineTextProps } from "../theme/textLayoutGuard";
import {
  computeTurkishPrintQfBaselineTextMetrics,
  TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR,
  TURKISH_PRINT_HATIM_MEDINA_PARITY,
} from "./quranTurkishPrintTypography";

/** Хатым парағы: экран жиегінен дәл 5px қауіпсіз шет. */
export const HATIM_PAGE_HORIZONTAL_SAFE_INSET = 5;

/** Экран жиегінен минималды бос орын (≥16px). */
export const QURAN_AYAH_MIN_HORIZONTAL_PADDING = 20;
export const QURAN_SCREEN_HORIZONTAL_PADDING = 20;
export const QURAN_SCREEN_VERTICAL_PADDING = 16;
export const QURAN_HATIM_COMPACT_LINE_HEIGHT_FACTOR = 1.62;
/** Medina QCF4 glyph line-height scale — Unicode text-hafs визуалды parity. */
export const QURAN_HATIM_MEDINA_LINE_HEIGHT_FACTOR = 1.48;
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
  opts?: { fitScale?: number; minFontSize?: number; fitScaleFloor?: number; skipWidthFactor?: boolean }
): number {
  const w = Math.max(280, contentWidth);
  const widthFactor = opts?.skipWidthFactor
    ? 1
    : Math.min(1.08, Math.max(0.82, w / REFERENCE_PHONE_WIDTH));
  const fitFloor = opts?.fitScaleFloor ?? 0.88;
  const fit = Math.max(fitFloor, Math.min(1, opts?.fitScale ?? 1));
  const minFs = opts?.minFontSize ?? MIN_READABLE_FONT;
  return Math.max(minFs, Math.round(baseFontSize * widthFactor * fit));
}

export function responsiveQuranLineHeight(
  fontSize: number,
  compact?: boolean,
  opts?: { medinaParity?: boolean; turkishPrintHatim?: boolean }
): number {
  const factor = compact
    ? opts?.turkishPrintHatim
      ? TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR
      : opts?.medinaParity
        ? QURAN_HATIM_MEDINA_LINE_HEIGHT_FACTOR
        : QURAN_HATIM_COMPACT_LINE_HEIGHT_FACTOR
    : QURAN_AYAH_LINE_HEIGHT_FACTOR;
  const minExtra = opts?.turkishPrintHatim ? 4 : 10;
  return Math.max(Math.round(fontSize * factor), fontSize + minExtra);
}

export function resolveQuranArabicTypography(
  contentWidth: number,
  baseFontSize: number,
  opts?: {
    compact?: boolean;
    fitScale?: number;
    minFontSize?: number;
    fitScaleFloor?: number;
    ayahScrollStyle?: boolean;
    /** QCF4 viewport-өлшемі: енге байланған widthFactor қолданылмайды. */
    skipWidthFactor?: boolean;
    /** Medina QCF4 line-height (1.48×) — Unicode Түрік баспа parity. */
    medinaParity?: boolean;
    /** Түрік Unicode хатым: ірі әріп + тар қatar (1.34×). */
    turkishPrintHatim?: boolean;
    /** Түрік Unicode баспа: Quran Foundation 28px / line-height 2.0. */
    turkishPrint?: boolean;
    mushafTextScale?: number;
  }
): { fontSize: number; lineHeight: number } {
  if (opts?.turkishPrint && !TURKISH_PRINT_HATIM_MEDINA_PARITY) {
    return computeTurkishPrintQfBaselineTextMetrics({
      contentWidth,
      mushafTextScale: opts.mushafTextScale ?? 1,
    });
  }
  const minFontSize = opts?.minFontSize ?? (opts?.compact ? MIN_HATIM_FONT : MIN_READABLE_FONT);
  const fitScaleFloor =
    opts?.fitScaleFloor ??
    (opts?.compact ? HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE : 0.88);
  const fontSize = opts?.ayahScrollStyle && !opts.compact
    ? responsiveQuranFontSizeAyahStyle(contentWidth)
    : responsiveQuranFontSize(contentWidth, baseFontSize, {
        fitScale: opts?.fitScale,
        minFontSize,
        fitScaleFloor,
        skipWidthFactor: opts?.skipWidthFactor,
      });
  return {
    fontSize,
    lineHeight: responsiveQuranLineHeight(fontSize, opts?.compact, {
      medinaParity: opts?.medinaParity,
      turkishPrintHatim: opts?.turkishPrintHatim,
    }),
  };
}

/** RTL контейнер — аят блоктары осы стильде (direction + padding). */
export function quranRtlContainerStyle(
  paddingH = QURAN_SCREEN_HORIZONTAL_PADDING,
  paddingV?: number,
  opts?: { minHorizontalPadding?: number }
): ViewStyle {
  const minH = opts?.minHorizontalPadding ?? QURAN_AYAH_MIN_HORIZONTAL_PADDING;
  return {
    width: "100%",
    alignSelf: "stretch",
    direction: "rtl",
    paddingHorizontal: Math.max(minH, paddingH),
    ...(paddingV != null ? { paddingVertical: paddingV } : null),
    overflow: "visible" as const,
  };
}

/** Сүре scroll тізімі: LTR контейнер — textAlign/writingDirection Text-те (Android RTL flip бұзбау). */
export function quranAyahScrollContainerStyle(paddingH = 0, paddingV?: number): ViewStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    paddingHorizontal: paddingH,
    ...(paddingV != null ? { paddingVertical: paddingV } : null),
    overflow: "visible" as const,
  };
}

/** Араб аят мәтіні орауышы — оң жақтан оқу (Khatm/sure scroll). */
export function quranAyahScrollArabicHostStyle(): ViewStyle {
  return Platform.OS === "android"
    ? {
        width: "100%",
        alignSelf: "stretch",
        alignItems: "stretch",
        overflow: "visible",
      }
    : {
        width: "100%",
        alignSelf: "stretch",
        direction: "rtl",
        alignItems: "stretch",
        overflow: "visible",
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

/** Android: `direction:rtl` flex-wrap жиі сол жаққа қалады — flex-end + Text width 100%. */
function quranAndroidFlexEndFlow(): Pick<ViewStyle, "alignItems" | "alignContent" | "justifyContent"> {
  return Platform.OS === "android"
    ? {
        alignItems: "flex-end",
        alignContent: "flex-end",
        justifyContent: "flex-end",
      }
    : {
        alignItems: "flex-start",
        alignContent: "flex-start",
        justifyContent: "flex-start",
      };
}

/** Аят + маркер қатары — flexWrap wrap, экраннан шықпайды. */
export function quranAyahRowStyle(): ViewStyle {
  const edge = quranAndroidFlexEndFlow();
  return {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    ...(Platform.OS === "android" ? null : { direction: "rtl" as const }),
    ...edge,
    overflow: "visible" as const,
  };
}

/** Хатым: барлық аяттар бір үздіксіз RTL ағыны — мәтін → маркер → келесі аят. */
export function quranContinuousFlowStyle(): ViewStyle {
  const edge = quranAndroidFlexEndFlow();
  return {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    ...(Platform.OS === "android" ? null : { direction: "rtl" as const }),
    ...edge,
    overflow: "visible" as const,
  };
}

/** Хатым кітап (604): әр аят толық ен — Android-safe column, Text оң жаққа. */
export function quranHatimBookStreamFlowStyle(): ViewStyle {
  return {
    width: "100%",
    alignSelf: "stretch",
    flexDirection: "column",
    alignItems: "stretch",
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
    width: "100%",
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

/** Сүре режимі: араб мәтін орауышы — толық ен, оңға тураланған. */
export function quranSurahArabicWrapStyle(): ViewStyle {
  return {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    minWidth: 0,
    maxWidth: "100%",
    width: "100%",
    alignSelf: "stretch",
    overflow: "visible" as const,
  };
}
