import { getExpoExtra } from "./expoExtra";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** CDN / веб статика: `{base}/{filename}.json` */
export function getBundledJsonBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_BUNDLED_JSON_BASE
      ? String(process.env.EXPO_PUBLIC_BUNDLED_JSON_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/bundled`;
  }

  return "https://rahatomir.com/assets/bundled";
}

export function bundledJsonRemoteUrl(name: string): string {
  return `${getBundledJsonBaseUrl()}/${name}`;
}
