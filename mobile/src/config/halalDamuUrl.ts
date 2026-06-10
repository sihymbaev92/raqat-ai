/**
 * ХАЛАЛ ДАМУ (ресми платформа) веб мекенжайы.
 * 1) EXPO_PUBLIC_HALAL_DAMU_URL (.env / build)
 * 2) app.config.js → expo.extra.halalDamuUrl
 */
import { getExpoExtra } from "./expoExtra";

/** Ресми түбір (REST `/wp-json` осы origin астында). */
const DEFAULT = "https://halaldamu.kz";

function trimTrailingSlashes(s: string): string {
  return s.trim().replace(/\/+$/, "");
}

export function getHalalDamuUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_HALAL_DAMU_URL
      ? String(process.env.EXPO_PUBLIC_HALAL_DAMU_URL).trim()
      : "";
  if (env) return trimTrailingSlashes(env);
  const raw = getExpoExtra()?.halalDamuUrl;
  if (raw != null && String(raw).trim()) return trimTrailingSlashes(String(raw));
  return DEFAULT;
}
