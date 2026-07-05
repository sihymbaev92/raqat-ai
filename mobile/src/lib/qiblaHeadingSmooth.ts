import { angleDiff } from "./qibla";

/**
 * Компас heading тегістеу — телефон қозғалмағанда стрелка «қуып» кетпеуі үшін.
 * balanced: тұрақты көрсету; fast: қолмен бұрғанда тез жауап (UI-да fast өшірілген).
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
  /** Телефон тұрақсыз тұрғанда шуды елемеу — balanced режимде кең dead zone. */
  const deadZone = mode === "fast" ? 0.08 : 0.55;
  if (absStep <= deadZone) {
    return prev;
  }
  /** Бір кадрда тым үлкен секіруді шектейміз (магнит шу / OEM jitter). */
  const maxStep = mode === "fast" ? 96 : 6;
  const clampedStep = Math.max(-maxStep, Math.min(maxStep, rawStep));
  const alpha = mode === "fast" ? 0.88 : 0.18;
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
  /** Азимут шамамен 0.1° шу — елемеу. */
  if (abs < 0.12) {
    return prev;
  }
  /** Орын айтарлықтай өзгерсе — бірден емес, жартылай жақындау. */
  const alpha = abs > 3 ? 0.32 : 0.22;
  const blended = prev + step * alpha;
  return ((blended % 360) + 360) % 360;
}
