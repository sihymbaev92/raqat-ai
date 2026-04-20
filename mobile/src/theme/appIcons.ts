/**
 * Қолданба бойынша біркелкі MaterialCommunityIcons атаулары.
 */
import type { ComponentProps } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Басты бет: батырмалар мен тор */
export const dashboardIcons = {
  heroQuran: "book-open-page-variant" as MciName,
  heroHadith: "book-multiple" as MciName,
  headerQibla: "compass-outline" as MciName,
  promoAi: "sparkles" as MciName,
  tileNamaz: "mosque" as MciName,
  tileDaily: "white-balance-sunny" as MciName,
  tileCommunity: "hands-pray" as MciName,
} as const;

/** Мазмұн орталығы тайлдары */
export const hubIcons = {
  quran: "book-open-page-variant" as MciName,
  hadith: "book-multiple" as MciName,
  namaz: "mosque" as MciName,
  ai: "robot-happy-outline" as MciName,
  hatim: "book-check" as MciName,
  daily: "weather-sunset" as MciName,
  comm: "hands-pray" as MciName,
  eco: "leaf" as MciName,
  tg: "telegram" as MciName,
} as const;

/** Төменгі таб: focused / blurred жұптары */
export const tabIcons = {
  duas: { active: "hands-pray" as MciName, inactive: "hands-pray-outline" as MciName },
  asma: "star-four-points" as MciName,
  tasbih: { active: "counter" as MciName, inactive: "gesture-tap" as MciName },
} as const;
