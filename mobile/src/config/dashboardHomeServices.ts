/** Басты бет торі — FAB launcher-дағы 12 модульмен бірдей, бірақ home-only thumbnail assets қолданады. */
import type { ImageSourcePropType } from "react-native";
import type { DashboardRadialItemKey } from "./dashboardRadialItems";
import { dashboardHomeTileImage } from "./dashboardHomeTileImages";
import { kk } from "../i18n/kk";

export type DashboardHomeServiceKey = DashboardRadialItemKey;

export type DashboardHomeServiceDef = {
  key: DashboardHomeServiceKey;
  label: string;
  image: ImageSourcePropType;
  color: string;
};

const DASHBOARD_HOME_SERVICE_BASE: Omit<DashboardHomeServiceDef, "label" | "image">[] = [
  { key: "quran", color: "#059669" },
  { key: "hadith", color: "#B45309" },
  { key: "namaz", color: "#2563EB" },
  { key: "tajweed", color: "#0D9488" },
  { key: "seerah", color: "#7C3AED" },
  { key: "hajj", color: "#EA580C" },
  { key: "tasbih", color: "#16A34A" },
  { key: "duas", color: "#DB2777" },
  { key: "asma", color: "#4F46E5" },
  { key: "ai", color: "#6366F1" },
  { key: "halal", color: "#10B981" },
  { key: "tradition", color: "#D97706" },
];

function dashboardHomeLabelForKey(key: DashboardHomeServiceKey): string {
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
    case "ai":
      return kk.dashboard.heroAiStripTitle;
    case "halal":
      return kk.features.halalTitle;
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export function getDashboardHomeServices(): DashboardHomeServiceDef[] {
  return DASHBOARD_HOME_SERVICE_BASE.map((item) => ({
    ...item,
    image: dashboardHomeTileImage(item.key),
    label: dashboardHomeLabelForKey(item.key),
  }));
}

export const DASHBOARD_HOME_SERVICES: DashboardHomeServiceDef[] = getDashboardHomeServices();

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
