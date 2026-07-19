import type { ImageSourcePropType } from "react-native";
import { menuIconAssets } from "../theme/menuIconAssets";
import { kk } from "../i18n/kk";

export type DashboardRadialItemKey =
  | "quran"
  | "hadith"
  | "namaz"
  | "asma"
  | "halal"
  | "duas"
  | "tasbih"
  | "tradition"
  | "seerah"
  | "tajweed"
  | "hajj"
  | "kmdb";

export type DashboardRadialItemDef = {
  key: DashboardRadialItemKey;
  label: string;
  image: ImageSourcePropType;
  /** Дөңгелек иконка фоны */
  color: string;
};

function dashboardLabelForKey(key: DashboardRadialItemKey): string {
  switch (key) {
    case "quran":
      return kk.dashboard.heroQuranTitle;
    case "hadith":
      return kk.dashboard.tileHadith;
    case "namaz":
      return kk.namazGuide.shortTitle;
    case "tajweed":
      return kk.dashboard.arabicLettersTile;
    case "duas":
      return kk.dashboard.duasShort;
    case "tasbih":
      return kk.tabs.tasbih;
    case "tradition":
      return kk.dashboard.traditionTileShort;
    case "seerah":
      return kk.dashboard.tileSeerah;
    case "hajj":
      return kk.features.hajjTitle;
    case "asma":
      return kk.tabs.asma;
    case "kmdb":
      return kk.kmdbHub.title;
    case "halal":
      return kk.features.halalTitle;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

/** Басты бет: 4×3 қызмет тайлдары (launcher-мен бірдей 12 модуль). */
const DASHBOARD_RADIAL_ITEM_BASE: Omit<DashboardRadialItemDef, "label">[] = [
  { key: "quran", image: menuIconAssets.heroQuran, color: "#059669" },
  { key: "hadith", image: menuIconAssets.heroHadith, color: "#B45309" },
  { key: "namaz", image: menuIconAssets.tileNamaz, color: "#2563EB" },
  { key: "tajweed", image: menuIconAssets.tileTajweed, color: "#0D9488" },
  { key: "seerah", image: menuIconAssets.tileSeerah, color: "#7C3AED" },
  { key: "hajj", image: menuIconAssets.tileHajj, color: "#EA580C" },
  { key: "tasbih", image: menuIconAssets.tabTasbih, color: "#16A34A" },
  { key: "duas", image: menuIconAssets.tabDuas, color: "#DB2777" },
  { key: "asma", image: menuIconAssets.tabAsma, color: "#4F46E5" },
  { key: "kmdb", image: menuIconAssets.promoKmdb, color: "#6366F1" },
  { key: "halal", image: menuIconAssets.tileHalal, color: "#10B981" },
  { key: "tradition", image: menuIconAssets.tileDinTradition, color: "#D97706" },
];

export function getDashboardRadialItems(): DashboardRadialItemDef[] {
  return DASHBOARD_RADIAL_ITEM_BASE.map((item) => ({
    ...item,
    label: dashboardLabelForKey(item.key),
  }));
}

export const DASHBOARD_RADIAL_ITEMS: DashboardRadialItemDef[] = getDashboardRadialItems();
