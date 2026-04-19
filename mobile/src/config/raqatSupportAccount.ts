/**
 * Жобаға қолдау — банк шоты / IBAN мәтіні (опция).
 * EXPO_PUBLIC_RAQAT_SUPPORT_ACCOUNT немесе app.json → extra.raqatSupportAccount
 */
import { getExpoExtra } from "./expoExtra";

export function getRaqatSupportAccount(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_SUPPORT_ACCOUNT
      ? String(process.env.EXPO_PUBLIC_RAQAT_SUPPORT_ACCOUNT)
      : "";
  if (env.trim()) return env.trim();
  const raw = getExpoExtra()?.raqatSupportAccount;
  if (raw != null && String(raw).trim()) return String(raw).trim();
  return "";
}
