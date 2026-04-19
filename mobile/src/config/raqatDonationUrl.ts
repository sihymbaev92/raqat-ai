/**
 * Жобаға қолдау / донат сілтемесі (опция).
 * EXPO_PUBLIC_RAQAT_DONATION_URL немесе app.config.js → extra.raqatDonationUrl
 */
import { getExpoExtra } from "./expoExtra";

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  return t;
}

export function getRaqatDonationUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_DONATION_URL
      ? String(process.env.EXPO_PUBLIC_RAQAT_DONATION_URL)
      : "";
  if (env.trim()) return normalizeUrl(env);
  const raw = getExpoExtra()?.raqatDonationUrl;
  if (raw != null && String(raw).trim()) return normalizeUrl(String(raw));
  return "";
}
