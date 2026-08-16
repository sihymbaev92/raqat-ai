import { useSyncExternalStore } from "react";
import { computeMushafPageViewportFitScale, mushafPageMinFitScale } from "./mushafPageAutoFit";

export type TurkishHatimFitSessionKey = string;

type SessionState = {
  key: TurkishHatimFitSessionKey | null;
  lockedScale: number | null;
};

const state: SessionState = {
  key: null,
  lockedScale: null,
};

const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((cb) => cb());
}

export function turkishHatimFitSessionKey(parts: {
  edition: string;
  pagerWidth: number;
  viewportHeight: number;
  linesAreaH: number;
  baseFontSize: number;
  bundledReady: boolean;
}): TurkishHatimFitSessionKey {
  return [
    parts.edition,
    parts.pagerWidth,
    parts.viewportHeight,
    parts.linesAreaH,
    parts.baseFontSize,
    parts.bundledReady ? 1 : 0,
  ].join(":");
}

export function resetTurkishHatimFitSession(): void {
  state.key = null;
  state.lockedScale = null;
  emit();
}

/** Бастапқы estimate — барлық беттер бір маштабпен оқиды. */
export function ensureTurkishHatimFitSession(key: TurkishHatimFitSessionKey, seedScale: number): void {
  const clamped = Math.max(0.01, seedScale);
  if (state.key !== key) {
    state.key = key;
    state.lockedScale = clamped;
    emit();
    return;
  }
  if (state.lockedScale == null) {
    state.lockedScale = clamped;
    emit();
  }
}

export function getTurkishHatimLockedFitScale(key: TurkishHatimFitSessionKey): number | null {
  if (state.key !== key) return null;
  return state.lockedScale;
}

/** Белсенді бет layout: overflow болса session scale тек төмен (барлық беттерге). */
export function refineTurkishHatimFitOnceFromLayout(
  key: TurkishHatimFitSessionKey,
  args: {
    contentHeight: number;
    linesAreaH: number;
    baseFontSize: number;
  }
): void {
  if (state.key !== key || state.lockedScale == null) return;
  if (args.linesAreaH <= 0 || args.contentHeight <= args.linesAreaH + 2) return;
  const minScale = mushafPageMinFitScale(args.baseFontSize, { unicodeTextHafs: true });
  const shrink = computeMushafPageViewportFitScale(
    args.contentHeight,
    args.linesAreaH,
    state.lockedScale,
    minScale,
    1
  );
  if (shrink != null && shrink < state.lockedScale - 0.003) {
    state.lockedScale = shrink;
    emit();
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useTurkishHatimLockedFitScale(key: TurkishHatimFitSessionKey | null): number | null {
  return useSyncExternalStore(
    subscribe,
    () => (key ? getTurkishHatimLockedFitScale(key) : null),
    () => null
  );
}
