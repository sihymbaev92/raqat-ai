export type ThemeColors = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  /** Алтын — батырмалар, сілтемелер, бүйірдегі аят жазбалары */
  accent: string;
  accentDark: string;
  border: string;
  success: string;
  error: string;
  /** Акценттің әлсіз фоны (тайл, дэшборд) */
  accentSurface: string;
  /** Акценті күштірек фон/шекара (бетбелгі, сақина) */
  accentSurfaceStrong: string;
  /**
   * Намаз: қосалқы түстер (келесі намаз градиенті `nextPrayerTheme.ts` + LinearGradient).
   */
  prayerCalmGreen: string;
  prayerCalmGreenSurface: string;
  prayerCalmGreenBorder: string;
  /**
   * Құран / хадис / дұға / зікір: араб әрпі (алтын),
   * оқылуы/транскрипция (жарқыраған ашық), қазақша мағына (таза контраст).
   */
  scriptureArabic: string;
  scriptureTranslit: string;
  scriptureMeaningKk: string;
};

/** Қанық, анық контраст — бұлыңғыр/сұр емес. */
export const darkColors: ThemeColors = {
  bg: "#070B10",
  card: "#15202B",
  text: "#FFFFFF",
  muted: "#E2E8F0",
  accent: "#2DD4BF",
  accentDark: "#14B8A6",
  border: "rgba(226, 232, 240, 0.42)",
  success: "#4ADE80",
  error: "#FB7185",
  accentSurface: "rgba(45, 212, 191, 0.22)",
  accentSurfaceStrong: "rgba(45, 212, 191, 0.38)",
  prayerCalmGreen: "#166534",
  prayerCalmGreenSurface: "rgba(22, 101, 52, 0.4)",
  prayerCalmGreenBorder: "rgba(74, 222, 128, 0.4)",
  scriptureArabic: "#F0D78C",
  scriptureTranslit: "#5EEAD4",
  scriptureMeaningKk: "#FFFFFF",
};

export const lightColors: ThemeColors = {
  bg: "#F3F0E8",
  card: "#FFFFFF",
  text: "#0B1220",
  muted: "#334155",
  accent: "#B45309",
  accentDark: "#92400E",
  border: "#B8AFA0",
  success: "#15803D",
  error: "#B91C1C",
  accentSurface: "rgba(180, 83, 9, 0.14)",
  accentSurfaceStrong: "rgba(180, 83, 9, 0.24)",
  prayerCalmGreen: "#166534",
  prayerCalmGreenSurface: "rgba(22, 101, 52, 0.12)",
  prayerCalmGreenBorder: "rgba(22, 101, 52, 0.35)",
  scriptureArabic: "#92400E",
  scriptureTranslit: "#0F766E",
  scriptureMeaningKk: "#0B1220",
};
