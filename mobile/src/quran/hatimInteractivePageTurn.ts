import type { HatimPageTurnDirection } from "../components/quran/HatimPageTurnOverlay";

export type HatimPageGrabEdge = "left" | "right" | "none";

export type HatimPageGrabAnchor = {
  direction: HatimPageTurnDirection;
  grabXRatio: number;
  grabYRatio: number;
  edge: HatimPageGrabEdge;
};

/** Саусақ бағыты — кез келген жерден ұстауға болады. */
export function hatimPageTurnDirectionFromDx(dx: number): HatimPageTurnDirection | null {
  if (dx > 6) return "forward";
  if (dx < -6) return "backward";
  return null;
}

export function hatimPageGrabEdge(locationX: number, pageWidth: number): HatimPageGrabEdge {
  const w = Math.max(1, pageWidth);
  const ratio = locationX / w;
  if (ratio <= 0.35) return "left";
  if (ratio >= 0.65) return "right";
  return "none";
}

export function hatimPageGrabAnchor(
  x0: number,
  y0: number,
  pageWidth: number,
  pageHeight: number,
  dx: number
): HatimPageGrabAnchor | null {
  const dir = hatimPageTurnDirectionFromDx(dx);
  if (!dir) return null;
  const w = Math.max(1, pageWidth);
  const h = Math.max(1, pageHeight);
  return {
    direction: dir,
    grabXRatio: Math.max(0, Math.min(1, x0 / w)),
    grabYRatio: Math.max(0, Math.min(1, y0 / h)),
    edge: hatimPageGrabEdge(x0, pageWidth),
  };
}

export function hatimPageTurnCanDrag(
  direction: HatimPageTurnDirection,
  pageIndex: number,
  pageCount: number
): boolean {
  if (pageCount <= 0) return false;
  if (direction === "forward") return pageIndex < pageCount - 1;
  return pageIndex > 0;
}

/** 0…1 — парақ майысуы баяу және көрінетін болуы үшін span үлкенірек. */
export function hatimPageTurnProgressFromDx(dx: number, pageWidth: number): number {
  const span = Math.max(120, pageWidth * 0.62);
  const eased = Math.min(1, Math.max(0, Math.abs(dx) / span));
  return eased * eased * (3 - 2 * eased);
}

export function hatimPageTurnSignedDx(
  direction: HatimPageTurnDirection,
  dx: number
): number {
  return direction === "forward" ? Math.max(0, dx) : Math.min(0, dx);
}

export function hatimPageTurnShouldCommit(
  dx: number,
  vx: number,
  pageWidth: number,
  progress: number
): boolean {
  const fast = Math.abs(vx) >= 0.45;
  if (fast && Math.sign(vx) === Math.sign(dx) && Math.abs(dx) >= pageWidth * 0.06) {
    return true;
  }
  return progress >= 0.28;
}

/** Ұстау биіктігі мен шеті — күшті еңкейіс. */
export function hatimPageTurnCornerSkewDeg(
  direction: HatimPageTurnDirection,
  grabYRatio: number,
  progress: number
): number {
  const centered = (grabYRatio - 0.5) * 2;
  const sign = direction === "forward" ? 1 : -1;
  return sign * centered * 11 * progress;
}

/** Анимация ортасында бет ауыстыру (peek астында көрінген). */
export function hatimPageTurnSwapDelayMs(
  fromProgress: number,
  turnMs = 680
): number {
  const remaining = Math.max(140, Math.round(turnMs * (1 - fromProgress)));
  return Math.min(remaining - 50, Math.round(remaining * 0.55));
}
