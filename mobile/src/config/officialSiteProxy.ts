import { getBundledRaqatApiBase } from "./raqatApiBase";

const OFFICIAL_HOSTS = new Set(["fatua.kz", "muftyat.kz", "imgs.muftyat.kz"]);

export function normalizeOfficialSiteHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

export function isOfficialIslamicSiteUrl(url: string | null | undefined): boolean {
  const raw = (url ?? "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return OFFICIAL_HOSTS.has(normalizeOfficialSiteHost(parsed.hostname));
  } catch {
    return false;
  }
}

export function isOfficialSiteProxyUrl(url: string | null | undefined): boolean {
  const raw = (url ?? "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.pathname.includes("/api/v1/official-site/proxy");
  } catch {
    return false;
  }
}

/** VPS API арқылы fatua/muftyat — ISP/WebView «соединение» қатесін айналдыру. */
export function resolveOfficialSiteEmbedUrl(
  originalUrl: string,
  apiBase?: string | null
): string {
  const raw = (originalUrl ?? "").trim();
  if (!raw || !isOfficialIslamicSiteUrl(raw) || isOfficialSiteProxyUrl(raw)) {
    return raw;
  }
  const base = (apiBase ?? getBundledRaqatApiBase() ?? "https://api.rahatomir.com").replace(/\/+$/, "");
  if (!base) return raw;
  return `${base}/api/v1/official-site/proxy?url=${encodeURIComponent(raw)}`;
}

/** WebView навигация: тікелей fatua/muftyat сілтемесін proxy URL-ге ауыстыру. */
export function coerceOfficialSiteNavigationUrl(
  nextUrl: string,
  apiBase?: string | null
): string {
  if (isOfficialSiteProxyUrl(nextUrl)) return nextUrl;
  if (!isOfficialIslamicSiteUrl(nextUrl)) return nextUrl;
  return resolveOfficialSiteEmbedUrl(nextUrl, apiBase);
}

export const OFFICIAL_SITE_PROXY_HOSTS = ["api.rahatomir.com", "rahatomir.com"] as const;
