import { getExpoExtra } from "./expoExtra";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** CDN / web static: `{base}/halal-companies-snapshot.json`. */
export function getHalalCompaniesSnapshotUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_HALAL_COMPANIES_SNAPSHOT_URL
      ? String(process.env.EXPO_PUBLIC_HALAL_COMPANIES_SNAPSHOT_URL)
      : "";
  if (env.trim()) return env.trim();

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/bundled/halal-companies-snapshot.json`;
  }

  return "https://rahatomir.com/assets/bundled/halal-companies-snapshot.json";
}
