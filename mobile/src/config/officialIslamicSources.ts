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

export function officialIslamicSourceHomeUrl(site: OfficialIslamicSourceId): string {
  return OFFICIAL_ISLAMIC_SOURCES[site].homeUrl;
}
