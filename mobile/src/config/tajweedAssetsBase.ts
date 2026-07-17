import { getExpoExtra } from "./expoExtra";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** CDN: `{base}/letters/*.mp3`, `{base}/muftyat/page-NNN.jpg` */
export function getTajweedAssetsBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_TAJWEED_ASSETS_BASE
      ? String(process.env.EXPO_PUBLIC_TAJWEED_ASSETS_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/tajweed`;
  }

  return "https://rahatomir.com/assets/tajweed";
}

export function tajweedLetterAudioUri(filename: string): string {
  return tajweedLetterAudioUris(filename)[0] ?? `${getTajweedAssetsBaseUrl()}/letters/${filename}`;
}

/** CDN URL тізімі (primary → rahatomir). */
export function tajweedLetterAudioUris(filename: string): string[] {
  const base = getTajweedAssetsBaseUrl();
  return [`${base}/letters/${filename}`];
}

export function tajweedMuftyatPageImageUri(page: number): string {
  return tajweedMuftyatPageImageUris(page)[0] ?? "";
}

/** Muftyat JPG — CDN URL тізімі. */
export function tajweedMuftyatPageImageUris(page: number): string[] {
  const p = Math.max(1, Math.min(104, Math.floor(page)));
  const name = `page-${String(p).padStart(3, "0")}.jpg`;
  const base = getTajweedAssetsBaseUrl();
  return [`${base}/muftyat/${name}`];
}
