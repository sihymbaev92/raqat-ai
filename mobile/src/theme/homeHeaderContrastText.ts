import { Platform, type TextStyle } from "react-native";
import type { ThemeColors } from "./colors";
import { BRAND_FONT_FACE } from "../fonts/brandFont";

/** Шапка: RAHAT OMIR, күн, температура — ақ/қара контраст (темаға байланысты). */
export function homeHeaderContrastTextBase(colors: ThemeColors, isDark: boolean): TextStyle {
  return {
    color: colors.text,
    ...Platform.select({
      ios: {
        textShadowColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.14)",
        textShadowOffset: { width: 0, height: 0.5 },
        textShadowRadius: 0.9,
      },
      default: {},
    }),
  };
}

/** Басты бет шапкасы: грегориан + хижра күн жолдары (сәл қалың, web/native бірдей). */
export function homeHeaderDateLineStyle(colors: ThemeColors, isDark: boolean): TextStyle {
  return {
    ...homeHeaderContrastTextBase(colors, isDark),
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.05,
    fontFamily: BRAND_FONT_FACE.bold,
    fontWeight: "700",
  };
}

/** Шапка бренді — жинақы, бірақ анық қалың. */
export function homeHeaderBrandTitleStyle(size: "lg" | "md" | "sm" = "lg"): TextStyle {
  return {
    fontFamily: BRAND_FONT_FACE.bold,
    fontWeight: "800",
    ...(size === "lg"
      ? { fontSize: 16, letterSpacing: 0.04, lineHeight: 20 }
      : size === "md"
        ? { fontSize: 14, letterSpacing: 0.03, lineHeight: 18 }
        : { fontSize: 13, letterSpacing: 0.02, lineHeight: 16 }),
  };
}