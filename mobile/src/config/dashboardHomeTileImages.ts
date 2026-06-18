import type { ImageSourcePropType } from "react-native";
import type { DashboardRadialItemKey } from "./dashboardRadialItems";

const DASHBOARD_HOME_TILE_THUMBNAILS: Record<DashboardRadialItemKey, ImageSourcePropType> = {
  quran: require("../../assets/dashboard/home-tiles/quran-thumb.png"),
  hadith: require("../../assets/dashboard/home-tiles/hadith-thumb.png"),
  namaz: require("../../assets/dashboard/home-tiles/namaz-thumb.png"),
  tajweed: require("../../assets/dashboard/home-tiles/tajweed-thumb.png"),
  seerah: require("../../assets/dashboard/home-tiles/seerah-thumb.png"),
  hajj: require("../../assets/dashboard/home-tiles/hajj-thumb.png"),
  tasbih: require("../../assets/dashboard/home-tiles/tasbih-thumb.png"),
  duas: require("../../assets/dashboard/home-tiles/duas-thumb.png"),
  asma: require("../../assets/dashboard/home-tiles/asma-thumb.png"),
  ai: require("../../assets/dashboard/home-tiles/ai-thumb.png"),
  halal: require("../../assets/dashboard/home-tiles/halal-thumb.png"),
  tradition: require("../../assets/dashboard/home-tiles/tradition-thumb.png"),
};

export function dashboardHomeTileImage(key: DashboardRadialItemKey): ImageSourcePropType {
  return DASHBOARD_HOME_TILE_THUMBNAILS[key];
}
