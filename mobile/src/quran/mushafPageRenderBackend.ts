import { mushafPageSvgUrl, mushafPageWebpUrl } from "../config/mushafPagesBase";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";

/**
 * Мұсаф бет render backend.
 * - text-hafs: bundled Unicode + typography (offline default)
 * - svg: 604 SVG pages (premium quality, CDN)
 * - webp/png: raster pages + ayah_map hotspots
 * - qcf4: QCF4 JSON + fonts (small APK, word/ayah tap)
 */
export type MushafPageRenderBackend = "text-hafs" | "svg" | "webp" | "qcf4";

function readBackendFromEnv(): MushafPageRenderBackend {
  const raw =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND
      ? String(process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND).trim().toLowerCase()
      : "";
  if (raw === "svg" || raw === "webp" || raw === "qcf4" || raw === "text-hafs") return raw;
  return "text-hafs";
}

export function mushafPageRenderBackend(): MushafPageRenderBackend {
  return readBackendFromEnv();
}

/**
 * 604 хатым: Quran.com «Түпнұсқа» темасында әдепкі QCF4 (Madinah нақышы + аят белгілері).
 * EXPO_PUBLIC_MUSHAF_PAGE_BACKEND басқа болса — ол басым.
 */
export function mushafBookPageRenderBackend(
  readingThemeId?: QuranReadingThemeId | null
): MushafPageRenderBackend {
  const env = readBackendFromEnv();
  if (env !== "text-hafs") return env;
  if (resolveQuranReadingTheme(readingThemeId).minimalPageChrome) {
    /** Quran.com клоны: QCF4 — 15 жол = бір Hafs бет (webp CDN болса env=webp). */
    return "qcf4";
  }
  return "text-hafs";
}

export function mushafBookEffectiveRenderBackend(
  readingThemeId?: QuranReadingThemeId | null,
  opts?: { showTajweedColors?: boolean; arabicScriptEdition?: string | null }
): MushafPageRenderBackend {
  /** Тәжуид: Sajda сияқты QCF4 мұсаф (сөз glyph) — Unicode Text span емес. */
  return mushafBookPageRenderBackend(readingThemeId);
}

export function isMushafWebpBackend(): boolean {
  return mushafPageRenderBackend() === "webp";
}

export function isMushafSvgBackend(): boolean {
  return mushafPageRenderBackend() === "svg";
}

export function isMushafQcf4Backend(): boolean {
  return mushafPageRenderBackend() === "qcf4";
}

export function isMushafRasterBackend(): boolean {
  const b = mushafPageRenderBackend();
  return b === "webp" || b === "svg";
}

/** 604 хатым: raster backend (ayah_map, webp URI). */
export function isMushafBookRasterBackend(
  readingThemeId?: QuranReadingThemeId | null
): boolean {
  const b = mushafBookPageRenderBackend(readingThemeId);
  return b === "webp" || b === "svg";
}

export function isMushafAssetBackend(): boolean {
  return mushafPageRenderBackend() !== "text-hafs";
}

/** WebP режимінде — CDN raster URI (env backend). */
export function mushafPageImageUri(page: number): string | null {
  if (!isMushafWebpBackend()) return null;
  const p = Math.floor(page);
  if (p < 1 || p > 604) return null;
  return mushafPageWebpUrl(p);
}

/** 604 хатым бет суреті — `mushafBookPageRenderBackend` бойынша. */
export function mushafBookPageImageUri(
  page: number,
  readingThemeId?: QuranReadingThemeId | null
): string | null {
  const backend = mushafBookPageRenderBackend(readingThemeId);
  const p = Math.floor(page);
  if (p < 1 || p > 604) return null;
  if (backend === "webp") return mushafPageWebpUrl(p);
  if (backend === "svg") return mushafPageSvgUrl(p);
  return null;
}

/** SVG режимінде — CDN SVG URI. */
export function mushafPageSvgUri(page: number): string | null {
  if (!isMushafSvgBackend()) return null;
  const p = Math.floor(page);
  if (p < 1 || p > 604) return null;
  return mushafPageSvgUrl(p);
}
