/**
 * Мұсаф / Hatim оқу UI константалары мен тығыздық пресеттері (бір көзден).
 */

export const MUSHAF_AYAHS_PER_PAGE = 4;

export type MushafDensityId = "tight" | "medium" | "comfort";

export const DEFAULT_MUSHAF_DENSITY: MushafDensityId = "tight";

/** Баптаулар мен оқу модалындағы тығыздық таңдауы үшін тәртіп (tight → comfort). */
export const MUSHAF_DENSITY_ORDER: readonly MushafDensityId[] = ["tight", "medium", "comfort"];

export type MushafDensityPreset = {
  /** Аят арабы: lineHeight ≈ arabAyahFont.lineHeight × factor × scale */
  arabLineHeightFactor: number;
  /** Бисмиллә жол биіктігі: arabAyahFont.lineHeight × factor × scale */
  bismLineHeightFactor: number;
  /** Бисмиллә қаріп өлшемі: fontSize × factor × scale */
  bismFontFactor: number;
  mushafAyahRowMarginBottom: number;
  mushafAyahRowPaddingVertical: number;
  mushafBismillahBannerMarginBottom: number;
  mushafBismillahBannerPaddingVertical: number;
  mushafAyahArabicClusterGap: number;
};

const PRESETS: Record<MushafDensityId, MushafDensityPreset> = {
  tight: {
    arabLineHeightFactor: 1.02,
    bismLineHeightFactor: 0.92,
    bismFontFactor: 1.08,
    /** Төменгі интервал — аяттар кітаптағыдай бір ағынға жақын */
    mushafAyahRowMarginBottom: 2,
    mushafAyahRowPaddingVertical: 0,
    mushafBismillahBannerMarginBottom: 8,
    mushafBismillahBannerPaddingVertical: 10,
    mushafAyahArabicClusterGap: 2,
  },
  medium: {
    arabLineHeightFactor: 1.06,
    bismLineHeightFactor: 0.98,
    bismFontFactor: 1.12,
    mushafAyahRowMarginBottom: 4,
    mushafAyahRowPaddingVertical: 1,
    mushafBismillahBannerMarginBottom: 12,
    mushafBismillahBannerPaddingVertical: 12,
    mushafAyahArabicClusterGap: 3,
  },
  comfort: {
    arabLineHeightFactor: 1.12,
    bismLineHeightFactor: 1.06,
    bismFontFactor: 1.18,
    mushafAyahRowMarginBottom: 10,
    mushafAyahRowPaddingVertical: 3,
    mushafBismillahBannerMarginBottom: 16,
    mushafBismillahBannerPaddingVertical: 14,
    mushafAyahArabicClusterGap: 4,
  },
};

export function getMushafDensityPreset(id: MushafDensityId | string | null | undefined): MushafDensityPreset {
  const k = normalizeMushafDensity(id);
  return PRESETS[k];
}

export function normalizeMushafDensity(raw: string | null | undefined): MushafDensityId {
  const s = (raw ?? "").trim();
  if (s === "tight" || s === "medium" || s === "comfort") return s;
  return DEFAULT_MUSHAF_DENSITY;
}
