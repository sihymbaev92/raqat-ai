import { getExpoExtra } from "./expoExtra";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/** CDN / веб static root: `{base}/pages`, `{base}/svg`, `{base}/qcf4`, `{base}/ayah_map.json`. */
export function getMushafPagesBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_MUSHAF_PAGES_BASE
      ? String(process.env.EXPO_PUBLIC_MUSHAF_PAGES_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/quran`;
  }

  return "https://rahatomir.com/assets/quran";
}

/** QCF4 upstream (sync script source) — MohamadHajjRabee/quran-qcf4. */
export function getQcf4UpstreamBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_QCF4_UPSTREAM_BASE
      ? String(process.env.EXPO_PUBLIC_QCF4_UPSTREAM_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);
  return "https://raw.githubusercontent.com/MohamadHajjRabee/quran-qcf4/main";
}

/** SVG upstream — Mushaf Database ligature SVG (sync script). */
export function getMushafSvgUpstreamBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_MUSHAF_SVG_UPSTREAM_BASE
      ? String(process.env.EXPO_PUBLIC_MUSHAF_SVG_UPSTREAM_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);
  return "https://raw.githubusercontent.com/mushafdatabase/MushafDatabase-Ligature-Based-SVG/main/pages";
}

export function mushafPagePadded(page: number): string {
  return String(Math.max(1, Math.min(604, Math.floor(page)))).padStart(3, "0");
}

export function mushafPageWebpUrl(page: number): string {
  return `${getMushafPagesBaseUrl()}/pages/${mushafPagePadded(page)}.webp`;
}

export function mushafPagePngUrl(page: number): string {
  return `${getMushafPagesBaseUrl()}/pages/${mushafPagePadded(page)}.png`;
}

/** Mushaf Database / CDN — 604 SVG (Hafs Madinah). */
export function mushafPageSvgUrl(page: number): string {
  return `${getMushafPagesBaseUrl()}/svg/${mushafPagePadded(page)}.svg`;
}

export function mushafAyahMapRemoteUrl(): string {
  return `${getMushafPagesBaseUrl()}/ayah_map.json`;
}

export function mushafQcf4PageJsonUrl(page: number): string {
  return `${getMushafPagesBaseUrl()}/qcf4/pages/${mushafPagePadded(page)}.json`;
}

export function mushafQcf4FontMapUrl(): string {
  return `${getMushafPagesBaseUrl()}/qcf4/font-map.json`;
}

export function mushafQcf4FontFileUrl(fontId: string, ext: "ttf" | "woff2" = "ttf"): string {
  const dir = ext === "woff2" ? "fonts-woff2" : "fonts";
  const file =
    fontId === "QCF4_QBSML"
      ? ext === "woff2"
        ? "QCF4_QBSML.woff2"
        : "QCF4_QBSML.ttf"
      : ext === "woff2"
        ? `${fontId}_W.woff2`
        : `${fontId}_W.ttf`;
  return `${getMushafPagesBaseUrl()}/qcf4/${dir}/${file}`;
}

/** Madinah mushaf page aspect (Mushaf Database viewBox). */
export const MUSHAF_PAGE_VIEWBOX = { w: 382.68, h: 547.09 } as const;

export function mushafPageAspectRatio(): number {
  return MUSHAF_PAGE_VIEWBOX.w / MUSHAF_PAGE_VIEWBOX.h;
}
