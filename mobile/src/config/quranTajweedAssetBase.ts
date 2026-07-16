import { getExpoExtra } from "./expoExtra";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** CDN: `{base}/quran_tajweed.json` */
export function getQuranTajweedAssetUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_QURAN_TAJWEED_ASSET_URL
      ? String(process.env.EXPO_PUBLIC_QURAN_TAJWEED_ASSET_URL)
      : "";
  if (env.trim()) return env.trim();

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/quran_tajweed.json`;
  }

  return "https://rahatomir.com/assets/quran_tajweed.json";
}
