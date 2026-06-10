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

export const darkColors: ThemeColors = {
  bg: "#0A0E13",
  card: "#1A232E",
  text: "#FFFFFF",
  muted: "#CBD5E1",
  accent: "#38B2AC",
  accentDark: "#2A8F8A",
  border: "rgba(148, 163, 184, 0.32)",
  success: "#5FD99A",
  error: "#F5A8A8",
  accentSurface: "rgba(56, 178, 172, 0.16)",
  accentSurfaceStrong: "rgba(56, 178, 172, 0.30)",
  prayerCalmGreen: "#1A4D35",
  prayerCalmGreenSurface: "rgba(26, 77, 53, 0.28)",
  prayerCalmGreenBorder: "rgba(82, 201, 138, 0.24)",
  scriptureArabic: "#D4BC78",
  scriptureTranslit: "#7DD3CF",
  scriptureMeaningKk: "#F8FAFC",
};

export const lightColors: ThemeColors = {
  bg: "#F6F4EF",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#475569",
  accent: "#C9A227",
  accentDark: "#A8841A",
  border: "#D5CFC3",
  success: "#2F8A55",
  error: "#B84A4A",
  accentSurface: "rgba(201, 162, 39, 0.12)",
  accentSurfaceStrong: "rgba(201, 162, 39, 0.20)",
  prayerCalmGreen: "#2E7A4D",
  prayerCalmGreenSurface: "rgba(46, 122, 77, 0.1)",
  prayerCalmGreenBorder: "rgba(61, 154, 98, 0.22)",
  scriptureArabic: "#A8841A",
  scriptureTranslit: "#178A7A",
  scriptureMeaningKk: "#1E293B",
};
