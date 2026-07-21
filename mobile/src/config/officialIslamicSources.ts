/** Ресми исламдық дереккөз URL-дары. */
export const FATUA_KK_HOME_URL = "https://fatua.kz/kk/";
export const MUFTYAT_KK_HOME_URL = "https://www.muftyat.kz/kk/";
export const MUFTYAT_KK_MOSQUES_MAP_URL = "https://www.muftyat.kz/kk/mosques/";

export type OfficialIslamicSourceId = "fatua" | "muftyat";

export const OFFICIAL_ISLAMIC_SOURCES = {
  fatua: {
    id: "fatua" as const,
    homeUrl: FATUA_KK_HOME_URL,
    origin: "https://fatua.kz",
  },
  muftyat: {
    id: "muftyat" as const,
    homeUrl: MUFTYAT_KK_HOME_URL,
    origin: "https://www.muftyat.kz",
  },
} as const;

/**
 * Locale path for official sites.
 * Fatua has no /en/ (404) — use kk for English and other locales without a site path.
 */
export function officialSiteLocalePath(
  locale: string,
  site: OfficialIslamicSourceId = "muftyat"
): "kk" | "ru" | "en" {
  if (locale === "ru") return "ru";
  if (locale === "en" && site === "muftyat") return "en";
  return "kk";
}

export function officialIslamicSourceHomeUrl(
  site: OfficialIslamicSourceId,
  locale?: string
): string {
  const path = officialSiteLocalePath(locale ?? "kk", site);
  if (site === "fatua") return `https://fatua.kz/${path}/`;
  return `https://www.muftyat.kz/${path}/`;
}
