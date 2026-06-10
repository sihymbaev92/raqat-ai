import type { ThemeColors } from "./colors";

/** Артқы фон пресеті (қараңғы/жарық режиміне сәйкес bg/card/border). */
export type BackgroundToneId = "default" | "tone56";

export const BACKGROUND_TONE_ORDER: BackgroundToneId[] = ["default", "tone56"];

type BgPatch = { dark: Partial<ThemeColors>; light: Partial<ThemeColors> };

/** RAHAT OMIR бренд фоны — баптауларда «5.6». */
const BACKGROUND_TONE_PATCHES: Record<Exclude<BackgroundToneId, "default">, BgPatch> = {
  tone56: {
    dark: {
      bg: "#0C1F1A",
      card: "#162822",
      border: "rgba(232, 200, 106, 0.22)",
    },
    light: {
      bg: "#E8F0EF",
      card: "#FFFFFF",
      border: "#C5D9D4",
    },
  },
};

export function applyBackgroundTone(
  colors: ThemeColors,
  toneId: BackgroundToneId,
  isDark: boolean
): ThemeColors {
  if (toneId === "default") return colors;
  const patch = BACKGROUND_TONE_PATCHES[toneId];
  return { ...colors, ...(isDark ? patch.dark : patch.light) };
}

export function isBackgroundToneId(raw: string | null | undefined): raw is BackgroundToneId {
  return raw != null && (BACKGROUND_TONE_ORDER as string[]).includes(raw);
}

/** Чип превьюсі (Settings). */
export function backgroundTonePreviewColor(toneId: BackgroundToneId, isDark: boolean): string {
  if (toneId === "default") {
    return isDark ? "#05080B" : "#F8FAFC";
  }
  return isDark ? BACKGROUND_TONE_PATCHES.tone56.dark.bg! : BACKGROUND_TONE_PATCHES.tone56.light.bg!;
}
