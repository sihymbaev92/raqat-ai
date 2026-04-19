/**
 * AI прокси: API `RAQAT_AI_PROXY_SECRET` сәйкес `X-Raqat-Ai-Secret`.
 * EXPO_PUBLIC_RAQAT_AI_SECRET немесе app.json → extra.raqatAiSecret
 *
 * Өндірісте JWT (scope ai) қолдану ұсынылады; бұл кілт MVP/жергілікті үшін.
 */
import { getExpoExtra } from "./expoExtra";

export function getRaqatAiSecret(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_AI_SECRET
      ? String(process.env.EXPO_PUBLIC_RAQAT_AI_SECRET)
      : "";
  if (env.trim()) return env.trim();
  const raw = getExpoExtra()?.raqatAiSecret;
  if (raw != null && String(raw).trim()) return String(raw).trim();
  return "";
}
