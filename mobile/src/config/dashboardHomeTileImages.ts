import type { ImageSourcePropType } from "react-native";
import type { DashboardRadialItemKey } from "./dashboardRadialItems";

const DASHBOARD_HOME_TILE_THUMBNAILS: Partial<Record<DashboardRadialItemKey, ImageSourcePropType>> = {};

const DASHBOARD_HOME_TILE_LOADERS: Record<DashboardRadialItemKey, () => ImageSourcePropType> = {
  quran: () => require("../../assets/dashboard/home-tiles/quran-thumb.webp"),
  hadith: () => require("../../assets/dashboard/home-tiles/hadith-thumb.webp"),
  namaz: () => require("../../assets/dashboard/home-tiles/namaz-thumb.webp"),
  tajweed: () => require("../../assets/dashboard/home-tiles/tajweed-thumb.webp"),
  seerah: () => require("../../assets/dashboard/home-tiles/seerah-thumb.webp"),
  hajj: () => require("../../assets/dashboard/home-tiles/hajj-thumb.webp"),
  tasbih: () => require("../../assets/dashboard/home-tiles/tasbih-thumb.webp"),
  duas: () => require("../../assets/dashboard/home-tiles/duas-thumb.webp"),
  asma: () => require("../../assets/dashboard/home-tiles/asma-thumb.webp"),
  kmdb: () => require("../../assets/dashboard/home-tiles/ai-thumb.webp"),
  halal: () => require("../../assets/dashboard/home-tiles/halal-thumb.webp"),
  tradition: () => require("../../assets/dashboard/home-tiles/tradition-thumb.webp"),
};

export function dashboardHomeTileImage(key: DashboardRadialItemKey): ImageSourcePropType {
  const cached = DASHBOARD_HOME_TILE_THUMBNAILS[key];
  if (cached) return cached;
  const loaded = DASHBOARD_HOME_TILE_LOADERS[key]();
  DASHBOARD_HOME_TILE_THUMBNAILS[key] = loaded;
  return loaded;
}
