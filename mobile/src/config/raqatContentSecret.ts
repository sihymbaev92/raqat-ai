/**
 * Контент оқу құпиясы (API `RAQAT_CONTENT_READ_SECRET` сәйкес).
 * EXPO_PUBLIC_RAQAT_CONTENT_SECRET немесе app.json → extra.raqatContentSecret
 */
import { getExpoExtra } from "./expoExtra";

export function getRaqatContentSecret(): string {
  const env =
    typeof process !== "undefined" &&
    process.env?.EXPO_PUBLIC_RAQAT_CONTENT_SECRET
      ? String(process.env.EXPO_PUBLIC_RAQAT_CONTENT_SECRET)
      : "";
  if (env.trim()) return env.trim();
  const raw = getExpoExtra()?.raqatContentSecret;
  if (raw != null && String(raw).trim()) return String(raw).trim();
  return "";
}
