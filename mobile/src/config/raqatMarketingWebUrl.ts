import { getExpoExtra } from "./expoExtra";

function trimUrl(s: string): string {
  return s.trim().replace(/\/+$/, "");
}

/** Ресми маркетинг вебі (ENV/app.config.js жоқ болса). */
export const DEFAULT_RAQAT_MARKETING_WEB_URL = "https://rahatomir.com";

/**
 * Ресми веб (маркетинг / басты бет) — `RaqatAIChatScreen` ішінде WebView ашу үшін.
 * API (`EXPO_PUBLIC_IMAM_AI_API_BASE`) осыған автоматты түрде айналдырылмайды; тек нақты веб мекенжайды беріңіз.
 *
 * 1) EXPO_PUBLIC_RAQAT_WEB_URL
 * 2) app.config.js → expo.extra.raqatWebUrl
 * 3) DEFAULT_RAQAT_MARKETING_WEB_URL
 */
export function getRaqatMarketingWebUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_RAQAT_WEB_URL
      ? String(process.env.EXPO_PUBLIC_RAQAT_WEB_URL).trim()
      : "";
  if (env) return trimUrl(env);
  const raw = getExpoExtra()?.raqatWebUrl;
  if (raw != null && String(raw).trim()) return trimUrl(String(raw));
  return DEFAULT_RAQAT_MARKETING_WEB_URL;
}
