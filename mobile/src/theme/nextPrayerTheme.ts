/**
 * «Келесі намаз» жолының фоны — қанық орман жасыл (мата реф. жақын).
 * Ақ картада әлсіз rgba көрінбейді, сондықтан толық hex градиент.
 */
export const NEXT_PRAYER_GRADIENT_HEX = ["#1B5E20", "#004B23", "#002411"] as const;

/** Жол ішіндегі мәтін: қою жасыл фонда контраст (ою/градиент үстінде де оқылуы үшін ағық). */
export const NEXT_PRAYER_STRIP_TEXT_PRIMARY = "#FFFFFF";
export const NEXT_PRAYER_STRIP_TEXT_SECONDARY = "rgba(255, 255, 255, 0.9)";

/** Градиент сызылмаса да мәтін ашық фонға түспесін — қою негіз. */
export const NEXT_PRAYER_STRIP_TRACK_BG = "#063220";

/** Прогресс жолының толық сынағы. */
export function nextPrayerProgressFillHex(isDark: boolean): string {
  return isDark ? "#66BB6A" : "#A5D6A7";
}

/** Келесі намаз жолы — толық жасыл градиент (фон нақты көрінеді). */
export function nextPrayerStripGradient(isDark: boolean): [string, string, string] {
  if (isDark) {
    return ["#2E7D32", "#1B5E20", "#0d2814"];
  }
  return [...NEXT_PRAYER_GRADIENT_HEX] as [string, string, string];
}

/** Прогресс трегі — дәл сол рең жақын, қанық. */
export function nextPrayerBarTrackGradient(isDark: boolean): [string, string, string] {
  if (isDark) {
    return ["#1B5E20", "#0d3d1c", "#061a0c"];
  }
  return ["#2E7D32", "#1B5E20", "#0d2814"];
}

export const NEXT_PRAYER_STRIP_BORDER = "rgba(0, 36, 17, 0.75)";
