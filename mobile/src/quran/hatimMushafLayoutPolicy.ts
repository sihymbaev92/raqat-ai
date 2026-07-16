import { Platform } from "react-native";
import { MUSHAF_BOOK_MAX_PAGE_WIDTH } from "./mushafBookPageLayout";

/**
 * Хатым mushaf — БІР ортақ настройка (барлық телефон, fold, tablet, web).
 * Тек аят мәтіні шеттері: Quran.com сияқты sol/oñ margin.
 * Basqa layout (justify, glyph, chrome) өзгертілмейді.
 */
/** Аят QCF4 қatarының sol/oñ шеті — экранға тимеу (Quran.com ~22px). */
export const HATIM_AYAH_EDGE_INSET = 22;
export const HATIM_QCF4_NATIVE_SAFE_INSET = 16;
export const HATIM_QCF4_WEB_SAFE_INSET = 10;
export const HATIM_QCF4_LINE_PADDING = HATIM_AYAH_EDGE_INSET;
export const HATIM_QCF4_LINE_SCALE_X = 1;
export const HATIM_QCF4_VERTICAL_SAFE_PADDING = 14;
export const HATIM_QCF4_CHROME_TOP_PADDING = 6;
export const HATIM_QCF4_EDGE_BLEED = 0;
/** Auto-focus highlight: page turn / tap дейін сақталсын. */
export const HATIM_AYAH_AUTO_FOCUS_PERSIST = true;

export type HatimMushafLayout = {
  bookPageWidth: number;
  centerBookColumn: boolean;
  frameWidth: number;
  horizontalSafeInset: number;
  linePadding: number;
  lineScaleX: number;
  verticalSafePadding: number;
  edgeBleed: number;
  /** Quran.com mushaf: қatar justify (space-between). */
  lineJustifyContent: "space-between";
  useHatimQcf4Metrics: true;
};

/** Барлық экрандар: кітап max 520px; тар экранда толық ен, кеңде ортада. */
export function mushafBookHatimDisplayWidth(pagerWidth: number): number {
  return Math.max(280, Math.min(pagerWidth, MUSHAF_BOOK_MAX_PAGE_WIDTH));
}

/** Хатым mushaf layout — native/web/platform бір функция. */
export function resolveHatimMushafLayout(
  pagerWidth: number,
  platform: string = Platform.OS
): HatimMushafLayout {
  const bookPageWidth = mushafBookHatimDisplayWidth(pagerWidth);
  const native = platform !== "web";
  return {
    bookPageWidth,
    centerBookColumn: bookPageWidth + 4 < pagerWidth,
    frameWidth: bookPageWidth,
    horizontalSafeInset: native ? HATIM_QCF4_NATIVE_SAFE_INSET : HATIM_QCF4_WEB_SAFE_INSET,
    linePadding: HATIM_QCF4_LINE_PADDING,
    lineScaleX: HATIM_QCF4_LINE_SCALE_X,
    verticalSafePadding: HATIM_QCF4_VERTICAL_SAFE_PADDING,
    edgeBleed: HATIM_QCF4_EDGE_BLEED,
    lineJustifyContent: "space-between",
    useHatimQcf4Metrics: true,
  };
}

export function hatimNativeTopInset(
  minimalPageChrome: boolean,
  insetsTop: number,
  platform: string = Platform.OS
): number {
  if (!minimalPageChrome) return insetsTop;
  if (platform === "web") return 0;
  return Math.max(insetsTop, 6);
}

export function hatimNativeBottomInset(
  minimalPageChrome: boolean,
  insetsBottom: number,
  platform: string = Platform.OS
): number {
  if (!minimalPageChrome || platform === "web") return 0;
  return Math.max(insetsBottom, 10);
}

export function hatimQcf4LineJustifyContent(): "space-between" {
  return "space-between";
}
