/** Клиент: сервердегі RAQAT_AI_KB_ONLY=1 сәйкес — тек Fatua/Muftyat AI. */
import { getExpoExtra } from "./expoExtra";

function truthy(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "1" || t === "true" || t === "yes" || t === "on";
}

/** EXPO_PUBLIC_RAQAT_AI_KB_ONLY → app.config.js extra.raqatAiKbOnly (әдепкі: қосулы). */
export function isRaqatAiKbOnlyClient(): boolean {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_AI_KB_ONLY
      ? String(process.env.EXPO_PUBLIC_RAQAT_AI_KB_ONLY)
      : "";
  if (env.trim()) {
    const t = env.trim().toLowerCase();
    if (t === "0" || t === "false" || t === "no" || t === "off") return false;
    return truthy(env);
  }
  const extra = getExpoExtra()?.raqatAiKbOnly;
  if (typeof extra === "boolean") return extra;
  if (typeof extra === "string" && extra.trim()) {
    const t = extra.trim().toLowerCase();
    if (t === "0" || t === "false" || t === "no" || t === "off") return false;
    return truthy(extra);
  }
  return true;
}
