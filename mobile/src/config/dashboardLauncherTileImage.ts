import type { ImageResizeMode } from "react-native";
import type { DashboardRadialItemKey } from "./dashboardRadialItems";

/** Launcher тайл ішіндегі PNG — ортаға туралау, zoom, padding. */
export type LauncherTileImageStyle = {
  resizeMode?: ImageResizeMode;
  /** Тайл ішіндегі ішкі padding (0..0.12) — барлық тайлда бірдей. */
  paddingRatio?: number;
  /** contain ішінде сәл үлкейту (1 = әдепкі) */
  scale?: number;
  translateX?: number;
  translateY?: number;
  opacity?: number;
  /** undefined → item.color (тилікті фон) */
  tileBackground?: string;
};

/** Барлық «Қызметтер» тайлдары — бірдей inset + contain + орта. */
export const LAUNCHER_TILE_INSET_RATIO = 0.038;

export const LAUNCHER_TILE_IMAGE_DEFAULT: LauncherTileImageStyle = {
  resizeMode: "contain",
  paddingRatio: LAUNCHER_TILE_INSET_RATIO,
  scale: 1.1,
};

/** Тек asset кадрындағы артық margin бар тайлдар — аз ғана zoom. */
const LAUNCHER_TILE_IMAGE_BY_KEY: Partial<
  Record<DashboardRadialItemKey, Partial<LauncherTileImageStyle>>
> = {
  /** Тәспі PNG-де төменгі жазу бар — толық көрінуі үшін zoom аз. */
  tasbih: {
    resizeMode: "contain",
    paddingRatio: 0.075,
    scale: 0.94,
  },
  /** Қажылық суреті tile ішінде сәл ірі көрінсін. */
  hajj: {
    resizeMode: "contain",
    paddingRatio: 0.02,
    scale: 1.2,
  },
  /** QMDB emblem — cover кесіп алмау */
  kmdb: {
    resizeMode: "contain",
    paddingRatio: 0.035,
    scale: 1.12,
    tileBackground: "#F3F4F6",
  },
  /** HALAL дөңгелек логотип — шеті кесілмесін */
  halal: {
    resizeMode: "contain",
    paddingRatio: 0.07,
    scale: 0.92,
    tileBackground: "#FFFFFF",
  },
};

/** Мазмұн хабы / AppIconBadge — дөңгелек PNG тайл өлшемі (px). */
export const HUB_MENU_TILE_BOX_PX = 100;

export function launcherTileImageStyle(key: DashboardRadialItemKey): LauncherTileImageStyle {
  return { ...LAUNCHER_TILE_IMAGE_DEFAULT, ...LAUNCHER_TILE_IMAGE_BY_KEY[key] };
}

export function launcherTileInsetPx(tileSize: number, paddingRatio = LAUNCHER_TILE_INSET_RATIO): number {
  return Math.max(0, Math.round(tileSize * paddingRatio));
}
