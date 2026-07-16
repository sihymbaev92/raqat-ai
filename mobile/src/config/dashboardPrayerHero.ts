import type { ImageSourcePropType } from "react-native";
import type { PrayerDaylightPhase } from "../theme/prayerHeroDaylight";

/**
 * «Намаз уақыты» экраны — Мәсжід ал-Харам, Қағба, Абрадж әл-Бейт сағаты.
 */
export const PRAYER_TIMES_SCREEN_HERO_BG =
  require("../../assets/dashboard/prayer_times_hero_prayer_times_screen.png") as ImageSourcePropType;

export type PrayerHeroSurface = "dashboardNext" | "prayerScreen";

/**
 * Намаз hero фоны — басты бет пен «Намаз уақыты» экраны бір сурет (пайдаланушы asset).
 */
export function resolvePrayerHeroBackground(
  _phase: PrayerDaylightPhase,
  _surface: PrayerHeroSurface
): ImageSourcePropType {
  return PRAYER_TIMES_SCREEN_HERO_BG;
}
