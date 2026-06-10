import { type ThemeColors } from "./colors";
import { getThemeSchemeBase, isThemeSchemeDark, type ThemeSchemeId } from "./themeSchemes";

/** Түс акценті палитрасы (қараңғы/жарық режимінен бөлек). */
export type ColorPaletteId =
  | "default"
  | "sapphire"
  | "violet"
  | "rose"
  | "forest"
  | "ember"
  | "gold"
  | "indigo"
  | "mint"
  | "lavender"
  | "crimson"
  | "ocean"
  | "coral"
  | "plum"
  | "sand"
  | "midnight";

export const COLOR_PALETTE_ORDER: ColorPaletteId[] = [
  "default",
  "sapphire",
  "violet",
  "rose",
  "forest",
  "ember",
  "gold",
  "indigo",
  "mint",
  "lavender",
  "crimson",
  "ocean",
  "coral",
  "plum",
  "sand",
  "midnight",
];

type Patch = { dark: Partial<ThemeColors>; light: Partial<ThemeColors> };

const PALETTE_PATCHES: Record<Exclude<ColorPaletteId, "default">, Patch> = {
  sapphire: {
    dark: {
      accent: "#38BDF8",
      accentDark: "#0284C7",
      accentSurface: "rgba(56, 189, 248, 0.16)",
      accentSurfaceStrong: "rgba(56, 189, 248, 0.28)",
      scriptureTranslit: "#7DD3FC",
      success: "#22D3EE",
    },
    light: {
      accent: "#0284C7",
      accentDark: "#0369A1",
      accentSurface: "rgba(2, 132, 199, 0.1)",
      accentSurfaceStrong: "rgba(2, 132, 199, 0.18)",
      scriptureTranslit: "#0E7490",
      success: "#0D9488",
    },
  },
  violet: {
    dark: {
      accent: "#C4B5FD",
      accentDark: "#8B5CF6",
      accentSurface: "rgba(139, 92, 246, 0.2)",
      accentSurfaceStrong: "rgba(139, 92, 246, 0.32)",
      scriptureTranslit: "#DDD6FE",
      success: "#A78BFA",
    },
    light: {
      accent: "#6D28D9",
      accentDark: "#5B21B6",
      accentSurface: "rgba(109, 40, 217, 0.1)",
      accentSurfaceStrong: "rgba(109, 40, 217, 0.18)",
      scriptureTranslit: "#5B21B6",
      success: "#7C3AED",
    },
  },
  rose: {
    dark: {
      accent: "#FB7185",
      accentDark: "#E11D48",
      accentSurface: "rgba(251, 113, 133, 0.16)",
      accentSurfaceStrong: "rgba(251, 113, 133, 0.28)",
      scriptureTranslit: "#FECDD3",
      success: "#F472B6",
    },
    light: {
      accent: "#BE123C",
      accentDark: "#9F1239",
      accentSurface: "rgba(190, 18, 60, 0.09)",
      accentSurfaceStrong: "rgba(190, 18, 60, 0.16)",
      scriptureTranslit: "#9D174D",
      success: "#A21CAF",
    },
  },
  forest: {
    dark: {
      accent: "#4ADE80",
      accentDark: "#16A34A",
      accentSurface: "rgba(74, 222, 128, 0.14)",
      accentSurfaceStrong: "rgba(74, 222, 128, 0.26)",
      scriptureTranslit: "#86EFAC",
      success: "#34D399",
    },
    light: {
      accent: "#15803D",
      accentDark: "#166534",
      accentSurface: "rgba(21, 128, 61, 0.1)",
      accentSurfaceStrong: "rgba(21, 128, 61, 0.17)",
      scriptureTranslit: "#0F766E",
      success: "#047857",
    },
  },
  ember: {
    dark: {
      accent: "#FB923C",
      accentDark: "#EA580C",
      accentSurface: "rgba(251, 146, 60, 0.16)",
      accentSurfaceStrong: "rgba(251, 146, 60, 0.28)",
      scriptureTranslit: "#FDBA74",
      success: "#FBBF24",
    },
    light: {
      accent: "#C2410C",
      accentDark: "#9A3412",
      accentSurface: "rgba(194, 65, 12, 0.09)",
      accentSurfaceStrong: "rgba(194, 65, 12, 0.16)",
      scriptureTranslit: "#B45309",
      success: "#A16207",
    },
  },
  gold: {
    dark: {
      accent: "#E8C86A",
      accentDark: "#C9A227",
      accentSurface: "rgba(232, 200, 106, 0.18)",
      accentSurfaceStrong: "rgba(232, 200, 106, 0.3)",
      scriptureTranslit: "#F5E6B8",
      success: "#4DB6AC",
    },
    light: {
      accent: "#B98A1A",
      accentDark: "#9A7311",
      accentSurface: "rgba(185, 138, 26, 0.1)",
      accentSurfaceStrong: "rgba(185, 138, 26, 0.18)",
      scriptureTranslit: "#92400E",
      success: "#15803D",
    },
  },
  indigo: {
    dark: {
      accent: "#818CF8",
      accentDark: "#6366F1",
      accentSurface: "rgba(129, 140, 248, 0.18)",
      accentSurfaceStrong: "rgba(129, 140, 248, 0.3)",
      scriptureTranslit: "#A5B4FC",
      success: "#818CF8",
    },
    light: {
      accent: "#4338CA",
      accentDark: "#3730A3",
      accentSurface: "rgba(67, 56, 202, 0.1)",
      accentSurfaceStrong: "rgba(67, 56, 202, 0.18)",
      scriptureTranslit: "#4338CA",
      success: "#4F46E5",
    },
  },
  mint: {
    dark: {
      accent: "#5EEAD4",
      accentDark: "#14B8A6",
      accentSurface: "rgba(45, 212, 191, 0.16)",
      accentSurfaceStrong: "rgba(45, 212, 191, 0.28)",
      scriptureTranslit: "#99F6E4",
      success: "#34D399",
    },
    light: {
      accent: "#0D9488",
      accentDark: "#0F766E",
      accentSurface: "rgba(13, 148, 136, 0.1)",
      accentSurfaceStrong: "rgba(13, 148, 136, 0.18)",
      scriptureTranslit: "#0F766E",
      success: "#059669",
    },
  },
  lavender: {
    dark: {
      accent: "#D8B4FE",
      accentDark: "#A855F7",
      accentSurface: "rgba(168, 85, 247, 0.18)",
      accentSurfaceStrong: "rgba(168, 85, 247, 0.3)",
      scriptureTranslit: "#E9D5FF",
      success: "#C084FC",
    },
    light: {
      accent: "#6B21A8",
      accentDark: "#581C87",
      accentSurface: "rgba(107, 33, 168, 0.1)",
      accentSurfaceStrong: "rgba(107, 33, 168, 0.18)",
      scriptureTranslit: "#5B21B6",
      success: "#7C3AED",
    },
  },
  crimson: {
    dark: {
      accent: "#FCA5A5",
      accentDark: "#EF4444",
      accentSurface: "rgba(248, 113, 113, 0.16)",
      accentSurfaceStrong: "rgba(248, 113, 113, 0.28)",
      scriptureTranslit: "#FECACA",
      success: "#F87171",
    },
    light: {
      accent: "#991B1B",
      accentDark: "#7F1D1D",
      accentSurface: "rgba(153, 27, 27, 0.09)",
      accentSurfaceStrong: "rgba(153, 27, 27, 0.16)",
      scriptureTranslit: "#9F1239",
      success: "#B91C1C",
    },
  },
  ocean: {
    dark: {
      accent: "#38BDF8",
      accentDark: "#0284C7",
      accentSurface: "rgba(14, 165, 233, 0.18)",
      accentSurfaceStrong: "rgba(14, 165, 233, 0.3)",
      scriptureTranslit: "#BAE6FD",
      success: "#22D3EE",
    },
    light: {
      accent: "#0369A1",
      accentDark: "#075985",
      accentSurface: "rgba(3, 105, 161, 0.1)",
      accentSurfaceStrong: "rgba(3, 105, 161, 0.18)",
      scriptureTranslit: "#0C4A6E",
      success: "#0891B2",
    },
  },
  coral: {
    dark: {
      accent: "#FB923C",
      accentDark: "#F97316",
      accentSurface: "rgba(249, 115, 22, 0.18)",
      accentSurfaceStrong: "rgba(249, 115, 22, 0.3)",
      scriptureTranslit: "#FED7AA",
      success: "#FDBA74",
    },
    light: {
      accent: "#EA580C",
      accentDark: "#C2410C",
      accentSurface: "rgba(234, 88, 12, 0.1)",
      accentSurfaceStrong: "rgba(234, 88, 12, 0.18)",
      scriptureTranslit: "#9A3412",
      success: "#D97706",
    },
  },
  plum: {
    dark: {
      accent: "#E879F9",
      accentDark: "#C026D3",
      accentSurface: "rgba(192, 38, 211, 0.18)",
      accentSurfaceStrong: "rgba(192, 38, 211, 0.3)",
      scriptureTranslit: "#F5D0FE",
      success: "#D946EF",
    },
    light: {
      accent: "#A21CAF",
      accentDark: "#86198F",
      accentSurface: "rgba(162, 28, 175, 0.1)",
      accentSurfaceStrong: "rgba(162, 28, 175, 0.18)",
      scriptureTranslit: "#701A75",
      success: "#9333EA",
    },
  },
  sand: {
    dark: {
      accent: "#E7CBA9",
      accentDark: "#C9A66B",
      accentSurface: "rgba(231, 203, 169, 0.16)",
      accentSurfaceStrong: "rgba(231, 203, 169, 0.28)",
      scriptureTranslit: "#F5E6D3",
      success: "#D4A574",
    },
    light: {
      accent: "#A16207",
      accentDark: "#854D0E",
      accentSurface: "rgba(161, 98, 7, 0.1)",
      accentSurfaceStrong: "rgba(161, 98, 7, 0.16)",
      scriptureTranslit: "#78350F",
      success: "#92400E",
    },
  },
  midnight: {
    dark: {
      accent: "#94A3B8",
      accentDark: "#64748B",
      accentSurface: "rgba(148, 163, 184, 0.16)",
      accentSurfaceStrong: "rgba(148, 163, 184, 0.28)",
      scriptureTranslit: "#CBD5E1",
      success: "#64748B",
    },
    light: {
      accent: "#475569",
      accentDark: "#334155",
      accentSurface: "rgba(71, 85, 105, 0.1)",
      accentSurfaceStrong: "rgba(71, 85, 105, 0.16)",
      scriptureTranslit: "#1E293B",
      success: "#475569",
    },
  },
};

function hexLuminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return 0.5;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function resolveThemeColors(schemeId: ThemeSchemeId, paletteId: ColorPaletteId): ThemeColors {
  const base = getThemeSchemeBase(schemeId);
  if (paletteId === "default") return base;
  const patch = PALETTE_PATCHES[paletteId];
  const isDark = isThemeSchemeDark(schemeId);
  return { ...base, ...(isDark ? patch.dark : patch.light) };
}

/** @deprecated paletteChipColors(isDark) — resolveThemeColors scheme арқылы */
export function paletteChipColorsForScheme(
  schemeId: ThemeSchemeId,
  paletteId: ColorPaletteId
): { fill: string; rim: string; label: string } {
  const c = resolveThemeColors(schemeId, paletteId);
  const fill = c.accent;
  const rim = c.accentDark;
  const label = hexLuminance(fill) > 0.62 ? "#0F172A" : "#FFFFFF";
  return { fill, rim, label };
}

export function paletteChipColors(paletteId: ColorPaletteId, isDark: boolean): { fill: string; rim: string; label: string } {
  const schemeId: ThemeSchemeId = isDark ? "noir" : "light";
  return paletteChipColorsForScheme(schemeId, paletteId);
}

export function isColorPaletteId(raw: string | null | undefined): raw is ColorPaletteId {
  return raw != null && (COLOR_PALETTE_ORDER as string[]).includes(raw);
}
