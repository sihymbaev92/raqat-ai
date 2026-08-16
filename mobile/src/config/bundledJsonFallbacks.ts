import type { BundledJsonName } from "../utils/bundledJsonTypes";
import { bundledJsonRemoteUrl } from "./bundledJsonBase";

const ALQURAN_API = "https://api.alquran.cloud/v1";

export const ALQURAN_TAJWEED_API_URL = `${ALQURAN_API}/quran/quran-tajweed`;
export const ALQURAN_UTHMANI_API_URL = `${ALQURAN_API}/quran/quran-uthmani`;
export const ALQURAN_UNICODE_API_URL = `${ALQURAN_API}/quran/quran-unicode`;

/** CDN жоқ/521 болса — жүктеу URL тізімі (API алдымен, содан CDN). */
export function bundledJsonDownloadUrls(name: BundledJsonName): string[] {
  const urls: string[] = [];
  if (name === "quran-uthmani-full.json") {
    urls.push(ALQURAN_UTHMANI_API_URL);
  }
  if (name === "quran-unicode-full.json") {
    urls.push(ALQURAN_UNICODE_API_URL);
  }
  const primary = bundledJsonRemoteUrl(name);
  if (!urls.includes(primary)) urls.push(primary);
  return urls;
}
