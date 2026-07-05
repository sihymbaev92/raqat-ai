import type { HatimDisplayMarginProfile } from "./hatimDisplayProfile";

/** Телефон ені: минималды bezel резерві (~1.4% әр жақ, min 5px). */
export const HATIM_MIN_SCREEN_EDGE_RATIO = 0.014;

/** QCF4 glyph side-bearing — экранға жақын, бірақ ink кесілмесін. */
export const HATIM_AYAH_EDGE_BLEED_PX = 5;

/** RTL қатар соңы: аят маркері (overflow:visible + бұл резерв). */
export const HATIM_MARKER_END_RESERVE = 14;

export type HatimScreenSafeArea = {
  left?: number;
  right?: number;
};

/** Safe area + экран ені → бір жақтың резерві. */
export function hatimHorizontalScreenReserve(
  windowWidth: number,
  safeArea?: HatimScreenSafeArea
): { left: number; right: number } {
  const w = Math.max(1, Math.round(windowWidth));
  const minSide = Math.max(5, Math.ceil(w * HATIM_MIN_SCREEN_EDGE_RATIO));
  const left = Math.max(minSide, Math.round(safeArea?.left ?? 0));
  const right = Math.max(minSide, Math.round(safeArea?.right ?? 0));
  return { left, right };
}

export function hatimHorizontalSafeInsetForScreen(
  profile: HatimDisplayMarginProfile,
  _windowWidth: number,
  native: boolean,
  _safeArea?: HatimScreenSafeArea
): number {
  return native ? profile.nativeSafeInset : profile.webSafeInset;
}

/** @deprecated hatimAyahEdgePaddingTight қолданыңыз */
export const HATIM_AYAH_MARKER_SCREEN_RESERVE = HATIM_MARKER_END_RESERVE;

/**
 * Аятты экран шетіне жақын ұстайды, кесілуді болдырмайды.
 * Сол жақта маркер резерві; оң жақ — минималды.
 */
export function hatimAyahEdgePaddingTight(
  windowWidth: number,
  safeArea?: HatimScreenSafeArea,
  extra?: { paddingLeft?: number; paddingRight?: number }
): { paddingLeft: number; paddingRight: number } {
  const { left, right } = hatimHorizontalScreenReserve(windowWidth, safeArea);
  const tightSide = HATIM_AYAH_EDGE_BLEED_PX + Math.max(left, right);
  const extraLeft = extra?.paddingLeft ?? 0;
  const extraRight = extra?.paddingRight ?? 0;
  return {
    paddingLeft:
      Math.max(
        tightSide,
        HATIM_AYAH_EDGE_BLEED_PX + left + HATIM_MARKER_END_RESERVE
      ) + extraLeft,
    paddingRight: tightSide + extraRight,
  };
}

/** Ayah-style ақ/қараңғы: таза бет, толық ен. */
export function hatimAyahBlockPaddingForQcomAyahPage(
  windowWidth: number,
  safeArea?: HatimScreenSafeArea
): { paddingLeft: number; paddingRight: number } {
  return hatimAyahEdgePaddingTight(windowWidth, safeArea);
}

/** RAQAT хром (muftyat т.б.): жақын margin + кіші kashida резерві. */
export function hatimAyahBlockPaddingForScreen(
  profile: HatimDisplayMarginProfile,
  windowWidth: number,
  safeArea?: HatimScreenSafeArea
): { paddingLeft: number; paddingRight: number } {
  return hatimAyahEdgePaddingTight(windowWidth, safeArea, {
    paddingLeft: Math.round(profile.ayahLineEndExtra * 0.35),
    paddingRight: Math.round(profile.ayahEdgeInset * 0.3),
  });
}
