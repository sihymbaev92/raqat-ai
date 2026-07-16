import { PixelRatio, Platform } from "react-native";
import { HATIM_LOCKED_MUSHAF_TEXT_SCALE } from "./mushafTextScale";

const HATIM_RS_BASE_WIDTH = 375;

/** Хатым: экран еніне пропорциялық өлшем (375px база). */
export function hatimRs(size: number, windowWidth: number, limitOnTablets = true): number {
  let targetWidth = Math.max(1, windowWidth);
  if (limitOnTablets && targetWidth > 600) {
    targetWidth *= 0.72;
  }
  const scale = targetWidth / HATIM_RS_BASE_WIDTH;
  const rounded = Math.round(PixelRatio.roundToNearestPixel(size * scale));
  return Platform.OS === "web" ? rounded : Math.min(rounded, Math.round(size * 1.35));
}

/** QCF4 glyph / mushafTextScale — clamp 1.15 шектеуін айналып өтпейді. */
export function hatimAutoMushafTextScaleForWidth(windowWidth: number): number {
  const w = Math.max(280, windowWidth);
  const widthFactor = Math.min(1.35, Math.max(0.82, w / HATIM_RS_BASE_WIDTH));
  return HATIM_LOCKED_MUSHAF_TEXT_SCALE * widthFactor;
}
