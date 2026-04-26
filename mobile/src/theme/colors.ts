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
   * Құран / хадис / дұға / зікір: араб әрпі (алтын),
   * оқылуы/транскрипция (жарқыраған ашық), қазақша мағына (таза контраст).
   */
  scriptureArabic: string;
  scriptureTranslit: string;
  scriptureMeaningKk: string;
};

export const darkColors: ThemeColors = {
  /** Томның көк-қоңыр фон, жарқыраудан сақтайды */
  bg: "#05080B",
  /** Карталар: фоннан сәл жарық қабат */
  card: "#0C1015",
  text: "#F2F4F5",
  muted: "#7A8B94",
  /** Ашық тиел — батырмалар, белгі, прогресс */
  accent: "#26A69A",
  /** Қою тиел — шекара, белсенді күй, сызықтар */
  accentDark: "#00897B",
  border: "#1f7a3f",
  success: "#4DB6AC",
  error: "#f29393",
  accentSurface: "rgba(38, 166, 154, 0.14)",
  accentSurfaceStrong: "rgba(38, 166, 154, 0.26)",
  scriptureArabic: "#D4AF37",
  scriptureTranslit: "#80CBC4",
  scriptureMeaningKk: "#FFFFFF",
};

export const lightColors: ThemeColors = {
  bg: "#e2efe6",
  card: "#ffffff",
  text: "#0f2418",
  muted: "#4a6758",
  accent: "#b8860b",
  accentDark: "#9a7209",
  border: "#7ac894",
  success: "#15803d",
  error: "#b91c1c",
  accentSurface: "rgba(184, 134, 11, 0.11)",
  accentSurfaceStrong: "rgba(184, 134, 11, 0.2)",
  scriptureArabic: "#9a7209",
  scriptureTranslit: "#0d9488",
  scriptureMeaningKk: "#0a1a12",
};
