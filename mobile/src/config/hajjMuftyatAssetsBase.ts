import { getExpoExtra } from "./expoExtra";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** CDN: `{base}/page-001.jpg` … release APK-да JPG bundle емес. */
export function getHajjMuftyatAssetsBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_HAJJ_MUFTYAT_ASSETS_BASE
      ? String(process.env.EXPO_PUBLIC_HAJJ_MUFTYAT_ASSETS_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/hajj/muftyat`;
  }

  return "https://rahatomir.com/assets/hajj/muftyat";
}

export function hajjMuftyatPageImageUri(page: number): string {
  const p = Math.max(1, Math.min(214, Math.floor(page)));
  return `${getHajjMuftyatAssetsBaseUrl()}/page-${String(p).padStart(3, "0")}.jpg`;
}
