/** Басты бет торі — FAB launcher-дағы 12 модульмен бірдей. */
import type { DashboardRadialItemKey } from "./dashboardRadialItems";

export {
  DASHBOARD_RADIAL_ITEMS as DASHBOARD_HOME_SERVICES,
  getDashboardRadialItems as getDashboardHomeServices,
  type DashboardRadialItemKey as DashboardHomeServiceKey,
} from "./dashboardRadialItems";

export function dashboardHomeServiceWebPath(key: DashboardRadialItemKey): string {
  switch (key) {
    case "quran":
      return "/more/quran";
    case "hadith":
      return "/more/hadith";
    case "namaz":
      return "/more/namaz-guide";
    case "tajweed":
      return "/more/tajweed";
    case "duas":
      return "/duas";
    case "tasbih":
      return "/tasbih";
    case "tradition":
      return "/more/tradition";
    case "seerah":
      return "/more/seerah";
    case "asma":
      return "/asma";
    case "hajj":
      return "/more/hajj";
    case "ai":
      return "/more/kmdb";
    case "halal":
      return "/more/halal";
  }
}
