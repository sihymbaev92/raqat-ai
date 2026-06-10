import type { TextStyle } from "react-native";
import { BRAND_FONT_FACE } from "../fonts/brandFont";

/** UI мәтіні — Nunito (жұмсақ бренд қаріпі). */
export const UI_FONT = BRAND_FONT_FACE;

/** Біркелкі өлшем шкаласы — оқуға ыңғайлы, сәл ірі. */
export const typography = {
  xs: { fontSize: 13, lineHeight: 17 },
  sm: { fontSize: 15, lineHeight: 21 },
  base: { fontSize: 17, lineHeight: 24 },
  md: { fontSize: 18, lineHeight: 25 },
  lg: { fontSize: 19, lineHeight: 27 },
  xl: { fontSize: 21, lineHeight: 29 },
  xxl: { fontSize: 25, lineHeight: 33 },
  tab: { fontSize: 12, lineHeight: 15 },
  header: { fontSize: 18, lineHeight: 23 },
} as const satisfies Record<string, Pick<TextStyle, "fontSize" | "lineHeight">>;

export type TypographySize = keyof typeof typography;

export function uiFontStyle(
  weight: "medium" | "semibold" | "bold" | "extrabold" = "medium"
): TextStyle {
  switch (weight) {
    case "extrabold":
      return { fontFamily: UI_FONT.extrabold, fontWeight: "800" };
    case "bold":
      return { fontFamily: UI_FONT.bold, fontWeight: "700" };
    case "semibold":
      return { fontFamily: UI_FONT.semibold, fontWeight: "600" };
    default:
      return { fontFamily: UI_FONT.medium, fontWeight: "500" };
  }
}

export function uiText(
  size: TypographySize = "base",
  weight: "medium" | "semibold" | "bold" | "extrabold" = "medium"
): TextStyle {
  return { ...uiFontStyle(weight), ...typography[size] };
}

/** React Navigation header title — барлық стектерде бірдей. */
export const navigationHeaderTitleStyle: Pick<TextStyle, "fontFamily" | "fontSize" | "fontWeight"> = {
  ...uiFontStyle("semibold"),
  fontSize: typography.header.fontSize,
};
