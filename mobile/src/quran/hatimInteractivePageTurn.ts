import type { HatimPageTurnDirection } from "../components/quran/HatimPageTurnOverlay";
import { HATIM_PAGE_TURN_MS } from "../components/quran/HatimPageTurnOverlay";

export type HatimPageGrabEdge = "left" | "right" | "none";

export type HatimPageGrabAnchor = {
  direction: HatimPageTurnDirection;
  grabXRatio: number;
  grabYRatio: number;
  edge: HatimPageGrabEdge;
};

/** Саусақ бағыты — кез келген жерден ұстауға болады. */
export function hatimPageTurnDirectionFromDx(dx: number): HatimPageTurnDirection | null {
  if (dx > 4) return "forward";
  if (dx < -4) return "backward";
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

/**
 * 0…1 — саусаққа жақын 1:1 ілесу (жеңіл ease).
 */
export function hatimPageTurnProgressFromDx(dx: number, pageWidth: number): number {
  const span = Math.max(110, pageWidth * 0.88);
  const t = Math.min(1, Math.max(0, Math.abs(dx) / span));
  return 1 - Math.pow(1 - t, 1.2);
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
  const fast = Math.abs(vx) >= 0.28;
  if (fast && Math.sign(vx) === Math.sign(dx) && Math.abs(dx) >= pageWidth * 0.04) {
    return true;
  }
  return progress >= 0.18;
}

/** Ұстау биіктігі — бұрыштан тартқанда күштірек еңкейіс. */
export function hatimPageTurnCornerSkewDeg(
  direction: HatimPageTurnDirection,
  grabYRatio: number,
  progress: number
): number {
  const centered = (grabYRatio - 0.5) * 2;
  const sign = direction === "forward" ? 1 : -1;
  return sign * centered * 16 * progress;
}

/** Анимация басында бет ауыстыру — fade астында жаңа бет көрінеді. */
export function hatimPageTurnSwapDelayMs(
  fromProgress: number,
  turnMs = HATIM_PAGE_TURN_MS
): number {
  void fromProgress;
  void turnMs;
  return 0;
}
