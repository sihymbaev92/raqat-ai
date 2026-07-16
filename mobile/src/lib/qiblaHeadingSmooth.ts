import { angleDiff } from "./qibla";

/**
 * Компас heading тегістеу — қолға тез ерсін, тұрғанда шуды бассын.
 * adaptive α: үлкен бұрылыста snap, кіші дірілде жеңіл blend.
 */
export function smoothHeading(
  mode: "balanced" | "fast",
  prev: number,
  next: number
): number {
  if (!Number.isFinite(next)) {
    return prev;
  }
  if (!Number.isFinite(prev)) {
    return ((next % 360) + 360) % 360;
  }
  const rawStep = angleDiff(prev, next);
  const absStep = Math.abs(rawStep);

  if (mode === "fast") {
    if (absStep <= 0.04) return prev;
    const alpha = absStep > 12 ? 1 : absStep > 4 ? 0.92 : 0.8;
    const blended = prev + rawStep * alpha;
    return ((blended % 360) + 360) % 360;
  }

  /** Dashboard chip: тұрақты, бірақ қуып қалмасын. */
  if (absStep <= 0.1) return prev;
  const alpha = absStep > 15 ? 0.88 : absStep > 5 ? 0.72 : 0.58;
  const maxStep = absStep > 30 ? 120 : 64;
  const clampedStep = Math.max(-maxStep, Math.min(maxStep, rawStep));
  const blended = prev + clampedStep * alpha;
  return ((blended % 360) + 360) % 360;
}

/**
 * GPS/Wi‑Fi координатынан құбыла азимуты — нақты орын өзгергенде секірмей, тегіс жаңарту.
 */
export function smoothBearing(prev: number | null, next: number): number {
  if (!Number.isFinite(next)) {
    return prev ?? 0;
  }
  const norm = ((next % 360) + 360) % 360;
  if (prev == null || !Number.isFinite(prev)) {
    return norm;
  }
  const step = angleDiff(prev, norm);
  const abs = Math.abs(step);
  if (abs < 0.12) {
    return prev;
  }
  const alpha = abs > 3 ? 0.42 : 0.28;
  const blended = prev + step * alpha;
  return ((blended % 360) + 360) % 360;
}
