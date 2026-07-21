import { darkColors, lightColors, type ThemeColors } from "./colors";

/** Қолданба фоны: 6 қараңғы + 6 жарық. */
export type ThemeSchemeId =
  | "noir"
  | "forest"
  | "teal"
  | "ocean"
  | "wine"
  | "midnight"
  | "light"
  | "meadow"
  | "mintDay"
  | "sky"
  | "sand"
  | "blush";

export const THEME_SCHEME_LIGHT_ORDER: ThemeSchemeId[] = [
  "light",
  "meadow",
  "mintDay",
  "sky",
  "sand",
  "blush",
];

export const THEME_SCHEME_DARK_ORDER: ThemeSchemeId[] = [
  "noir",
  "forest",
  "teal",
  "ocean",
  "wine",
  "midnight",
];

export const THEME_SCHEME_ORDER: ThemeSchemeId[] = [
  ...THEME_SCHEME_LIGHT_ORDER,
  ...THEME_SCHEME_DARK_ORDER,
];

type SchemeDef = {
  isDark: boolean;
  previewBg: string;
  previewCard: string;
  previewAccent: string;
  previewLabel: string;
  base: ThemeColors;
};

const SCHEMES: Record<ThemeSchemeId, SchemeDef> = {
  noir: {
    isDark: true,
    previewBg: "#070B10",
    previewCard: "#15202B",
    previewAccent: "#2DD4BF",
    previewLabel: "#FFFFFF",
    base: {
      ...darkColors,
      bg: "#070B10",
      card: "#15202B",
      text: "#FFFFFF",
      muted: "#E2E8F0",
      border: "rgba(226, 232, 240, 0.42)",
      accent: "#2DD4BF",
      accentDark: "#14B8A6",
      accentSurface: "rgba(45, 212, 191, 0.22)",
      accentSurfaceStrong: "rgba(45, 212, 191, 0.38)",
      scriptureArabic: "#F0D78C",
      scriptureTranslit: "#5EEAD4",
      scriptureMeaningKk: "#FFFFFF",
    },
  },
  forest: {
    isDark: true,
    previewBg: "#071510",
    previewCard: "#0F2018",
    previewAccent: "#52C98A",
    previewLabel: "#E4F5EB",
    base: {
      ...darkColors,
      bg: "#071510",
      card: "#0F2018",
      text: "#FFFFFF",
      muted: "#9BBFA8",
      border: "rgba(82, 201, 138, 0.16)",
      accent: "#52C98A",
      accentDark: "#2FA66A",
      accentSurface: "rgba(82, 201, 138, 0.12)",
      accentSurfaceStrong: "rgba(82, 201, 138, 0.22)",
      scriptureArabic: "#C9B56A",
      scriptureTranslit: "#8FD9B0",
      scriptureMeaningKk: "#F0FDF4",
      prayerCalmGreen: "#1A4D35",
      prayerCalmGreenSurface: "rgba(26, 77, 53, 0.32)",
      prayerCalmGreenBorder: "rgba(82, 201, 138, 0.28)",
    },
  },
  teal: {
    isDark: true,
    previewBg: "#081916",
    previewCard: "#0F2420",
    previewAccent: "#4FD1C5",
    previewLabel: "#E0FAF5",
    base: {
      ...darkColors,
      bg: "#081916",
      card: "#0F2420",
      text: "#FFFFFF",
      muted: "#94C4BC",
      border: "rgba(79, 209, 197, 0.16)",
      accent: "#4FD1C5",
      accentDark: "#2BA89E",
      accentSurface: "rgba(79, 209, 197, 0.12)",
      accentSurfaceStrong: "rgba(79, 209, 197, 0.22)",
      scriptureArabic: "#C9B56A",
      scriptureTranslit: "#99F0E4",
      scriptureMeaningKk: "#ECFDF5",
      prayerCalmGreen: "#134E48",
      prayerCalmGreenSurface: "rgba(19, 78, 72, 0.3)",
      prayerCalmGreenBorder: "rgba(79, 209, 197, 0.26)",
    },
  },
  ocean: {
    isDark: true,
    previewBg: "#060D18",
    previewCard: "#0C1828",
    previewAccent: "#6CB4F5",
    previewLabel: "#E3F0FF",
    base: {
      ...darkColors,
      bg: "#060D18",
      card: "#0C1828",
      text: "#FFFFFF",
      muted: "#94A8C4",
      border: "rgba(108, 180, 245, 0.15)",
      accent: "#6CB4F5",
      accentDark: "#3D8FD9",
      accentSurface: "rgba(108, 180, 245, 0.12)",
      accentSurfaceStrong: "rgba(108, 180, 245, 0.22)",
      scriptureArabic: "#C9B56A",
      scriptureTranslit: "#A8D4FF",
      scriptureMeaningKk: "#F0F7FF",
      prayerCalmGreen: "#0C3A5E",
      prayerCalmGreenSurface: "rgba(12, 58, 94, 0.28)",
      prayerCalmGreenBorder: "rgba(108, 180, 245, 0.24)",
    },
  },
  wine: {
    isDark: true,
    previewBg: "#140810",
    previewCard: "#1E1018",
    previewAccent: "#E8A0BC",
    previewLabel: "#FAEBF2",
    base: {
      ...darkColors,
      bg: "#140810",
      card: "#1E1018",
      text: "#FFFFFF",
      muted: "#C4A0B0",
      border: "rgba(232, 160, 188, 0.14)",
      accent: "#E8A0BC",
      accentDark: "#C76B94",
      accentSurface: "rgba(232, 160, 188, 0.12)",
      accentSurfaceStrong: "rgba(232, 160, 188, 0.22)",
      scriptureArabic: "#D4BC78",
      scriptureTranslit: "#F0C4D8",
      scriptureMeaningKk: "#FFF5F8",
      prayerCalmGreen: "#4A1D35",
      prayerCalmGreenSurface: "rgba(74, 29, 53, 0.28)",
      prayerCalmGreenBorder: "rgba(232, 160, 188, 0.22)",
    },
  },
  midnight: {
    isDark: true,
    previewBg: "#0D1118",
    previewCard: "#161C28",
    previewAccent: "#94A8D4",
    previewLabel: "#E8EDF5",
    base: {
      ...darkColors,
      bg: "#0D1118",
      card: "#161C28",
      text: "#FFFFFF",
      muted: "#A0AEC4",
      border: "rgba(148, 168, 212, 0.16)",
      accent: "#94A8D4",
      accentDark: "#6B82B8",
      accentSurface: "rgba(148, 168, 212, 0.12)",
      accentSurfaceStrong: "rgba(148, 168, 212, 0.22)",
      scriptureArabic: "#C9B56A",
      scriptureTranslit: "#B8C8E8",
      scriptureMeaningKk: "#F1F5F9",
      prayerCalmGreen: "#2D3748",
      prayerCalmGreenSurface: "rgba(45, 55, 72, 0.32)",
      prayerCalmGreenBorder: "rgba(148, 168, 212, 0.24)",
    },
  },
  light: {
    isDark: false,
    previewBg: "#F3F0E8",
    previewCard: "#FFFFFF",
    previewAccent: "#B45309",
    previewLabel: "#0B1220",
    base: {
      ...lightColors,
      bg: "#F3F0E8",
      card: "#FFFFFF",
      text: "#0B1220",
      muted: "#334155",
      border: "#B8AFA0",
      accent: "#B45309",
      accentDark: "#92400E",
      accentSurface: "rgba(180, 83, 9, 0.14)",
      accentSurfaceStrong: "rgba(180, 83, 9, 0.24)",
      scriptureArabic: "#92400E",
      scriptureTranslit: "#0F766E",
      scriptureMeaningKk: "#0B1220",
    },
  },
  meadow: {
    isDark: false,
    previewBg: "#EEF5EE",
    previewCard: "#FAFCFA",
    previewAccent: "#3D9A62",
    previewLabel: "#1A3D2E",
    base: {
      ...lightColors,
      bg: "#EEF5EE",
      card: "#FAFCFA",
      text: "#1A3D2E",
      muted: "#6B8578",
      border: "#C8E6D0",
      accent: "#3D9A62",
      accentDark: "#2E7A4D",
      accentSurface: "rgba(61, 154, 98, 0.1)",
      accentSurfaceStrong: "rgba(61, 154, 98, 0.16)",
      scriptureArabic: "#8B7340",
      scriptureTranslit: "#2E7A6A",
      scriptureMeaningKk: "#1A3D2E",
      prayerCalmGreen: "#2E7A4D",
      prayerCalmGreenSurface: "rgba(46, 122, 77, 0.1)",
      prayerCalmGreenBorder: "rgba(61, 154, 98, 0.24)",
    },
  },
  mintDay: {
    isDark: false,
    previewBg: "#E8F7F4",
    previewCard: "#F8FDFC",
    previewAccent: "#1FA896",
    previewLabel: "#134E48",
    base: {
      ...lightColors,
      bg: "#E8F7F4",
      card: "#F8FDFC",
      text: "#134E48",
      muted: "#5F8A84",
      border: "#B8E8E0",
      accent: "#1FA896",
      accentDark: "#178A7A",
      accentSurface: "rgba(31, 168, 150, 0.1)",
      accentSurfaceStrong: "rgba(31, 168, 150, 0.16)",
      scriptureArabic: "#8B7340",
      scriptureTranslit: "#178A7A",
      scriptureMeaningKk: "#134E48",
      prayerCalmGreen: "#178A7A",
      prayerCalmGreenSurface: "rgba(23, 138, 122, 0.1)",
      prayerCalmGreenBorder: "rgba(31, 168, 150, 0.22)",
    },
  },
  sky: {
    isDark: false,
    previewBg: "#EBF4FC",
    previewCard: "#F9FCFF",
    previewAccent: "#2E8FD4",
    previewLabel: "#0C3A5E",
    base: {
      ...lightColors,
      bg: "#EBF4FC",
      card: "#F9FCFF",
      text: "#0C3A5E",
      muted: "#5E7A94",
      border: "#C5DFF2",
      accent: "#2E8FD4",
      accentDark: "#1E72AD",
      accentSurface: "rgba(46, 143, 212, 0.1)",
      accentSurfaceStrong: "rgba(46, 143, 212, 0.16)",
      scriptureArabic: "#8B7340",
      scriptureTranslit: "#1E72AD",
      scriptureMeaningKk: "#0C3A5E",
      prayerCalmGreen: "#1E72AD",
      prayerCalmGreenSurface: "rgba(30, 114, 173, 0.1)",
      prayerCalmGreenBorder: "rgba(46, 143, 212, 0.22)",
    },
  },
  sand: {
    isDark: false,
    previewBg: "#F5F0E6",
    previewCard: "#FDFBF7",
    previewAccent: "#C17F3A",
    previewLabel: "#5C3D1E",
    base: {
      ...lightColors,
      bg: "#F5F0E6",
      card: "#FDFBF7",
      text: "#5C3D1E",
      muted: "#8A7560",
      border: "#E5D8C4",
      accent: "#C17F3A",
      accentDark: "#A06628",
      accentSurface: "rgba(193, 127, 58, 0.1)",
      accentSurfaceStrong: "rgba(193, 127, 58, 0.16)",
      scriptureArabic: "#A8841A",
      scriptureTranslit: "#8B5A28",
      scriptureMeaningKk: "#5C3D1E",
      prayerCalmGreen: "#A06628",
      prayerCalmGreenSurface: "rgba(160, 102, 40, 0.1)",
      prayerCalmGreenBorder: "rgba(193, 127, 58, 0.22)",
    },
  },
  blush: {
    isDark: false,
    previewBg: "#FAF0F2",
    previewCard: "#FFFBFC",
    previewAccent: "#C45C7A",
    previewLabel: "#7A2840",
    base: {
      ...lightColors,
      bg: "#FAF0F2",
      card: "#FFFBFC",
      text: "#7A2840",
      muted: "#9A7080",
      border: "#F0D0D8",
      accent: "#C45C7A",
      accentDark: "#A84864",
      accentSurface: "rgba(196, 92, 122, 0.08)",
      accentSurfaceStrong: "rgba(196, 92, 122, 0.14)",
      scriptureArabic: "#A8841A",
      scriptureTranslit: "#A84864",
      scriptureMeaningKk: "#7A2840",
      prayerCalmGreen: "#A84864",
      prayerCalmGreenSurface: "rgba(168, 72, 100, 0.08)",
      prayerCalmGreenBorder: "rgba(196, 92, 122, 0.2)",
    },
  },
};

export function getThemeSchemeBase(id: ThemeSchemeId): ThemeColors {
  return SCHEMES[id].base;
}

export function isThemeSchemeDark(id: ThemeSchemeId): boolean {
  return SCHEMES[id].isDark;
}

export function themeSchemePreview(id: ThemeSchemeId): {
  bg: string;
  card: string;
  accent: string;
  label: string;
  isDark: boolean;
} {
  const s = SCHEMES[id];
  return {
    bg: s.previewBg,
    card: s.previewCard,
    accent: s.previewAccent,
    label: s.previewLabel,
    isDark: s.isDark,
  };
}

export function isThemeSchemeId(raw: string | null | undefined): raw is ThemeSchemeId {
  return raw != null && (THEME_SCHEME_ORDER as string[]).includes(raw);
}

/** Ескі dark/light/system → жаңа тема. */
export function migrateLegacyThemeMode(raw: string | null | undefined, systemDark: boolean): ThemeSchemeId {
  if (raw === "dark") return "noir";
  if (raw === "light") return "light";
  if (raw === "system") return systemDark ? "noir" : "light";
  return "light";
}
